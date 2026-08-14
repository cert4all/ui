#!/usr/bin/env bash

# Catraca de CLASSE de caminho, irma da check-large-files.sh.
#
# Por que as duas: a catraca de tamanho tem teto por arquivo, e o acidente mais
# caro do portfolio passou por baixo dele. Em 13/08/2026 o `attached_assets/` do
# Cert4All somava 834 MB de historia em centenas de imagens de 2 a 5 MB — nenhuma
# chegava perto de 10 MB, entao um teto por blob nao teria barrado nada. O que
# essas pastas tem em comum nao e o tamanho de cada arquivo, e o fato de serem
# saida (upload de usuario, artefato de build, dependencia, virtualenv): conteudo
# que se regenera e que Git guarda para sempre.
#
# Modos:
#   --staged  (padrao)  o que esta no indice agora — usado pelo pre-commit
#   --tree              o que ja esta em HEAD — rede de baixo custo
#   --range A..B        o que os commits do intervalo INTRODUZIRAM na historia,
#                       mesmo que um commit posterior tenha apagado o arquivo;
#                       e este o modo para CI (ver nota em check-large-files.sh)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Duas listas, porque "em qualquer nivel" e cedo demais para nome generico.
#
# Aprendido na pratica em 13/08/2026: a primeira versao bloqueava `storage/` em
# qualquer nivel e reprovou `server/lib/storage/client.ts` no Huga e
# `src/assist/storage/emMemoria.ts` no Hugi — camada de persistencia, codigo
# legitimo. Uma blocklist que quebra uso legitimo e desinstalada na primeira
# semana, e ai nao protege de nada.

# Nunca sao fonte, em nivel nenhum: ninguem escreve codigo dentro dessas pastas.
BLOCKED_ANYWHERE=(
  'node_modules/'
  '.venv/'
  'venv/'
  'site-packages/'
  '__pycache__/'
  'DerivedData/'
  '.local/state/'
  'dist/'
  'build/'
)

# Nomes genericos que so sao suspeitos na RAIZ do repositorio. Na raiz,
# `storage/` e `uploads/` sao deposito de arquivo de usuario — foi assim que o
# Cert4All acumulou 3,4 GB e 132 MB. Aninhados, sao quase sempre modulo de codigo.
BLOCKED_AT_ROOT=(
  'uploads/'
  'storage/'
  'attached_assets/'
)

# PNG/JPG soltos NAO entram em lista nenhuma: logo e icone versionado e
# legitimo, e os repos do portfolio tem de 17 a 45 deles.

# 25 MB somados no mesmo commit. Pega a despejada em lote que passa por baixo do
# teto por arquivo sem depender de a pasta estar na lista acima.
MAX_COMMIT_BYTES="${MAX_COMMIT_BYTES:-26214400}"

MODE="${1:---staged}"
RANGE="${2:-}"

human() {
  awk -v bytes="$1" 'BEGIN { printf "%.1f MB", bytes / 1048576 }'
}

paths_in_scope() {
  case "$MODE" in
    --staged) git -C "$REPO_ROOT" diff --cached --name-only -z --diff-filter=ACMR ;;
    --tree)
      git -C "$REPO_ROOT" rev-parse --verify -q HEAD > /dev/null || return 0
      git -C "$REPO_ROOT" ls-tree -r --name-only -z HEAD
      ;;
    --range)
      # Caminhos que o intervalo INTRODUZIU, mesmo que um commit posterior os
      # tenha apagado — ver a nota em check-large-files.sh sobre por que --tree
      # nao basta. rev-list --objects imprime "<sha> <caminho>"; o caminho pode
      # conter espaco, entao cortamos so no primeiro.
      git -C "$REPO_ROOT" rev-list --objects $RANGE \
        | while IFS=' ' read -r _sha path; do
            [[ -n "$path" ]] && printf '%s\0' "$path"
          done
      ;;
    *)
      echo "check-tracked-paths: modo desconhecido: $MODE (use --staged, --tree ou --range A..B)" >&2
      exit 2
      ;;
  esac
}

# Validado ANTES de coletar, no shell principal. Dentro de `< <(...)` um `exit`
# so mata o subshell: o script seguiria com zero caminhos e reportaria "passed".
# Gate que fica verde por invocacao errada e pior do que gate nenhum.
if [[ "$MODE" == "--range" ]]; then
  [[ -n "$RANGE" ]] || { echo "check-tracked-paths: --range exige um intervalo (ex: origin/main..HEAD)" >&2; exit 2; }
  git -C "$REPO_ROOT" rev-list --max-count=1 $RANGE > /dev/null 2>&1 \
    || { echo "check-tracked-paths: intervalo invalido ou refs ausentes: $RANGE" >&2; exit 2; }
fi

blocked=()
total_bytes=0

while IFS= read -r -d '' path; do
  # Excecao declarada por repositorio, em vez de desligar a catraca inteira.
  # ALLOW_BLOCKED_PATHS=1 libera tudo; isto libera exatamente um prefixo, e o
  # resto das classes continua valendo. Ver o caso do `ui` em
  # patterns/mechanical-guardrails.md.
  skip=0
  if [[ -n "${ALLOWED_PATH_EXCEPTIONS:-}" ]]; then
    IFS=',' read -ra excecoes <<< "$ALLOWED_PATH_EXCEPTIONS"
    for ex in "${excecoes[@]}"; do
      ex="${ex// /}"
      [[ -n "$ex" ]] || continue
      if [[ "$path" == "$ex"* ]]; then skip=1; break; fi
    done
  fi
  (( skip )) && continue

  hit=0
  for bad in "${BLOCKED_ANYWHERE[@]}"; do
    # na raiz ou aninhada: `dist/x` e `apps/web/dist/x`
    if [[ "$path" == "$bad"* || "$path" == *"/$bad"* ]]; then
      blocked+=("$bad|$path")
      hit=1
      break
    fi
  done
  if (( ! hit )); then
    for bad in "${BLOCKED_AT_ROOT[@]}"; do
      # so na raiz: `storage/x` sim, `server/lib/storage/x` nao
      if [[ "$path" == "$bad"* ]]; then
        blocked+=("(raiz) $bad|$path")
        break
      fi
    done
  fi

  if [[ "$MODE" == "--staged" ]]; then
    sha="$(git -C "$REPO_ROOT" ls-files --stage -- "$path" | awk 'NR == 1 { print $2 }')"
    [[ -n "$sha" ]] || continue
    total_bytes=$(( total_bytes + $(git -C "$REPO_ROOT" cat-file -s "$sha") ))
  fi
done < <(paths_in_scope)

# Num intervalo o mesmo caminho aparece uma vez por commit que o carrega.
if (( ${#blocked[@]} > 1 )); then
  IFS=$'\n' read -r -d '' -a blocked < <(printf '%s\n' "${blocked[@]}" | sort -u && printf '\0')
fi

fail=0

if (( ${#blocked[@]} > 0 )); then
  if [[ "${ALLOW_BLOCKED_PATHS:-0}" == "1" ]]; then
    echo "Path check ignorado por ALLOW_BLOCKED_PATHS=1 (${#blocked[@]} arquivo(s))." >&2
  else
    {
      echo "Path check failed: caminho que nao deve ser versionado no indice."
      printf '%s\n' "${blocked[@]}" | awk -F'|' '{ print "  - [" $1 "]  " $2 }' | head -20
      if (( ${#blocked[@]} > 20 )); then
        echo "  ... e mais $(( ${#blocked[@]} - 20 )) arquivo(s)."
      fi
      echo
      echo "Regra aplicada: essas pastas sao saida, nao fonte — upload de usuario,"
      echo "artefato de build, dependencia, virtualenv. Regeneram-se a partir do que"
      echo "ja esta versionado, e Git nao esquece o que entrou uma vez."
      echo "Proximo passo: git restore --staged <caminho> e acrescente a pasta ao"
      echo ".gitignore. Se este caminho REALMENTE precisa ser versionado, repita o"
      echo "comando com ALLOW_BLOCKED_PATHS=1."
    } >&2
    fail=1
  fi
fi

if [[ "$MODE" == "--staged" ]] && (( total_bytes > MAX_COMMIT_BYTES )); then
  if [[ "${ALLOW_LARGE_COMMIT:-0}" == "1" ]]; then
    echo "Commit-size check ignorado por ALLOW_LARGE_COMMIT=1 ($(human "$total_bytes"))." >&2
  else
    {
      echo "Commit-size check failed: $(human "$total_bytes") somados no indice"
      echo "(teto: $(human "$MAX_COMMIT_BYTES"))."
      echo
      echo "Regra aplicada: nenhum arquivo precisa estourar o teto individual para o"
      echo "commit inteiro ficar caro — foi assim que 834 MB de imagens entraram no"
      echo "Cert4All, poucos MB por vez."
      echo "Proximo passo: confira o que esta staged com git diff --cached --stat e"
      echo "tire o que for saida. Se o lote e legitimo, repita com ALLOW_LARGE_COMMIT=1."
    } >&2
    fail=1
  fi
fi

if (( fail == 0 )); then
  echo "Path check passed ($(( ${#BLOCKED_ANYWHERE[@]} + ${#BLOCKED_AT_ROOT[@]} )) classes bloqueadas, modo: ${MODE#--})."
fi

exit "$fail"
