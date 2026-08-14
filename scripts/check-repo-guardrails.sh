#!/usr/bin/env bash

# Gate de CI das catracas de binario. Roda check-large-files.sh e
# check-tracked-paths.sh no modo --range, que audita o que os commits
# INTRODUZIRAM na historia — nao so o que sobrou na arvore de HEAD.
#
# Existe porque o pre-commit e burlavel com --no-verify. Este gate roda no
# servidor, onde --no-verify nao alcanca.
#
# Uso:
#   check-repo-guardrails.sh                 # deduz o intervalo do ambiente
#   check-repo-guardrails.sh origin/main..HEAD
#
# Nao depende de npm, node ou de qualquer coisa especifica de projeto — so de
# git e bash. E o mesmo script em todos os repositorios do portfolio.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

ZERO=0000000000000000000000000000000000000000

resolve_range() {
  # 1. intervalo explicito ganha de tudo
  if [[ -n "${1:-}" ]]; then
    echo "$1"; return
  fi

  # 2. pull request: compara com a base do PR
  if [[ -n "${GITHUB_BASE_REF:-}" ]]; then
    echo "origin/${GITHUB_BASE_REF}..HEAD"; return
  fi

  # 3. push: usa o antes/depois do evento, quando o antes existe.
  #    Em branch nova o `before` vem zerado — nesse caso nao da para delimitar,
  #    e caimos no item 4.
  if [[ -n "${GUARDRAILS_BEFORE:-}" && "${GUARDRAILS_BEFORE}" != "$ZERO" ]]; then
    if git rev-list --max-count=1 "${GUARDRAILS_BEFORE}" > /dev/null 2>&1; then
      echo "${GUARDRAILS_BEFORE}..HEAD"; return
    fi
  fi

  # 4. sem delimitacao confiavel: audita a historia alcancavel inteira.
  #    Mais caro e mais rigoroso — de proposito. O modo silencioso de falhar
  #    seria escolher um intervalo vazio e passar verde.
  echo "HEAD"
}

RANGE="$(resolve_range "${1:-}")"

if [[ "$RANGE" == "HEAD" ]]; then
  echo "Guardrails: sem intervalo delimitado no ambiente — auditando a historia alcancavel inteira."
else
  echo "Guardrails: auditando o intervalo $RANGE"
fi
echo

fail=0
bash "$REPO_ROOT/scripts/check-large-files.sh" --range "$RANGE" || fail=1
bash "$REPO_ROOT/scripts/check-tracked-paths.sh" --range "$RANGE" || fail=1

echo
if (( fail )); then
  echo "Guardrails: REPROVADO."
  echo
  echo "Regra aplicada: o pre-commit barra isso na maquina, mas e burlavel com"
  echo "--no-verify. Se chegou aqui, entrou por fora da catraca."
  echo "Proximo passo: reescreva os commits do intervalo tirando o arquivo"
  echo "(git rebase -i, ou git filter-repo se ja estiver espalhado pela historia)."
  echo "Remover num commit novo NAO resolve: o blob continua no historico."
  exit 1
fi

echo "Guardrails: aprovado."
