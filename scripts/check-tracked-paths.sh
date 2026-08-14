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
#   --tree              o que ja esta em HEAD — usado pelo gate de repositorio,
#                       porque hook e burlavel com --no-verify

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Nenhum destes caminhos e rastreado por nenhum repo do portfolio hoje
# (auditado em 13/08/2026), entao a lista barra uma classe que ja esta em zero.
# PNG/JPG soltos NAO entram aqui: logo e icone versionado e legitimo, e os
# repos tem de 17 a 45 deles.
BLOCKED_PATHS=(
  'uploads/'
  'storage/'
  'attached_assets/'
  'node_modules/'
  'dist/'
  'build/'
  '.venv/'
  'venv/'
  'site-packages/'
  '.local/state/'
  'DerivedData/'
  '__pycache__/'
)

# 25 MB somados no mesmo commit. Pega a despejada em lote que passa por baixo do
# teto por arquivo sem depender de a pasta estar na lista acima.
MAX_COMMIT_BYTES="${MAX_COMMIT_BYTES:-26214400}"

MODE="${1:---staged}"

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
    *)
      echo "check-tracked-paths: modo desconhecido: $MODE (use --staged ou --tree)" >&2
      exit 2
      ;;
  esac
}

blocked=()
total_bytes=0

while IFS= read -r -d '' path; do
  for bad in "${BLOCKED_PATHS[@]}"; do
    # casa a pasta na raiz ou em qualquer nivel: `dist/x` e `apps/web/dist/x`
    if [[ "$path" == "$bad"* || "$path" == *"/$bad"* ]]; then
      blocked+=("$bad|$path")
      break
    fi
  done

  if [[ "$MODE" == "--staged" ]]; then
    sha="$(git -C "$REPO_ROOT" ls-files --stage -- "$path" | awk 'NR == 1 { print $2 }')"
    [[ -n "$sha" ]] || continue
    total_bytes=$(( total_bytes + $(git -C "$REPO_ROOT" cat-file -s "$sha") ))
  fi
done < <(paths_in_scope)

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
  echo "Path check passed (${#BLOCKED_PATHS[@]} classes bloqueadas, modo: ${MODE#--})."
fi

exit "$fail"
