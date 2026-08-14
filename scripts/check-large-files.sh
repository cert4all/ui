#!/usr/bin/env bash

# Catraca de tamanho de blob. Motivo concreto: em 17/07/2026 um backup
# `.tar.gz` de 793 MB foi staged por engano no Stonen e inchou `.git` para
# 20 GB — 19 GB disso eram 64 packs abortados no meio, um por tentativa de
# empacotar aquele blob. O `.gitignore` cobre o NOME daquele backup; esta
# catraca cobre a CLASSE do acidente.
#
# O padrao se repetiu em todo o portfolio porque a catraca so existia aqui.
# Auditoria de 13/08/2026: o `.git` do Cert4All tinha 4,8 GB, sendo 3,4 GB de
# `storage/`, 834 MB de `attached_assets/` e 132 MB de `uploads/` — upload de
# usuario versionado por meses. O `granito` rastreia 2 arquivos hoje e carrega
# 779 MB de virtualenv na historia. Nos dois casos o `.gitignore` chegou depois
# do commit, e `.gitignore` nao apaga o que ja entrou. Por isso a catraca e
# pre-commit: o unico momento barato de dizer nao.
#
# Modos:
#   --staged  (padrao)  o que esta no indice agora — usado pelo pre-commit
#   --tree              o que ja esta em HEAD — usado pelo gate de repositorio,
#                       porque hook e burlavel com --no-verify

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# 10 MB. Fora os binarios que esta catraca existe para barrar, o maior arquivo
# de codigo do portfolio e um `routes.ts` de 1,19 MB — o teto tem uma ordem de
# grandeza de folga sobre o que os projetos legitimamente versionam. Ajuste por
# repositorio com MAX_BLOB_BYTES no .git/config se algum caso justificar.
MAX_BLOB_BYTES="${MAX_BLOB_BYTES:-10485760}"

MODE="${1:---staged}"

human() {
  awk -v bytes="$1" 'BEGIN { printf "%.1f MB", bytes / 1048576 }'
}

offenders=()

collect_staged() {
  local path sha size
  while IFS= read -r -d '' path; do
    sha="$(git -C "$REPO_ROOT" ls-files --stage -- "$path" | awk 'NR == 1 { print $2 }')"
    [[ -n "$sha" ]] || continue
    size="$(git -C "$REPO_ROOT" cat-file -s "$sha")"
    if (( size > MAX_BLOB_BYTES )); then
      offenders+=("$size|$path")
    fi
  done < <(git -C "$REPO_ROOT" diff --cached --name-only -z --diff-filter=ACMR)
}

collect_tree() {
  local record meta path size
  git -C "$REPO_ROOT" rev-parse --verify -q HEAD > /dev/null || return 0
  while IFS= read -r -d '' record; do
    meta="${record%%$'\t'*}"
    path="${record#*$'\t'}"
    size="$(awk '{ print $4 }' <<< "$meta")"
    [[ "$size" == "-" ]] && continue
    if (( size > MAX_BLOB_BYTES )); then
      offenders+=("$size|$path")
    fi
  done < <(git -C "$REPO_ROOT" ls-tree -r -l -z HEAD)
}

case "$MODE" in
  --staged) collect_staged ;;
  --tree) collect_tree ;;
  *)
    echo "check-large-files: modo desconhecido: $MODE (use --staged ou --tree)" >&2
    exit 2
    ;;
esac

if (( ${#offenders[@]} == 0 )); then
  echo "Large-file check passed (teto: $(human "$MAX_BLOB_BYTES"), modo: ${MODE#--})."
  exit 0
fi

if [[ "${ALLOW_LARGE_FILES:-0}" == "1" ]]; then
  echo "Large-file check ignorado por ALLOW_LARGE_FILES=1:" >&2
  for entry in "${offenders[@]}"; do
    echo "  - $(human "${entry%%|*}")  ${entry#*|}" >&2
  done
  exit 0
fi

{
  echo "Large-file check failed: blob acima do teto de $(human "$MAX_BLOB_BYTES")."
  for entry in "${offenders[@]}"; do
    echo "  - $(human "${entry%%|*}")  ${entry#*|}"
  done
  echo
  echo "Regra aplicada: arquivo grande em Git e permanente — o objeto fica no historico"
  echo "mesmo depois de removido do working tree, e cada repack tenta reempacota-lo."
  echo "Proximo passo: tire o arquivo do indice (git restore --staged <arquivo>), guarde-o"
  echo "fora da arvore do projeto e, se o padrao puder se repetir, acrescente-o ao .gitignore."
  echo "Se o arquivo REALMENTE precisa ser versionado, repita o comando com ALLOW_LARGE_FILES=1."
} >&2

exit 1
