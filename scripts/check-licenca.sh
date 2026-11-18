#!/usr/bin/env bash
#
# GUARDA: o repositório declara que o código é proprietário, e nada declara o contrário (C43, item 2, 2026-11-07).
#
# Por que existe: até 07/11 o package.json do Cert4All dizia "license": "MIT" e não havia LICENSE. Para uma ferramenta de
# diligência, isso é a empresa dizendo em público que qualquer um pode usar o código. Ninguém escolheu o MIT: era o default
# de um template. Corrigir uma vez não basta, porque o próximo `npm init` ou template traz o default de volta.
#
# O que confere, no ÍNDICE (como o repositório fica depois do commit):
#   1. existe LICENSE na raiz, com "Todos os direitos reservados", e sem texto de licença aberta (MIT, GPL, Apache, BSD, ISC);
#   2. todo package.json rastreado (fora node_modules, fixtures e .claude/worktrees) tem "license": "UNLICENSED"
#      ou "SEE LICENSE IN LICENSE". Campo ausente reprova: o silêncio é o que deixou o MIT entrar.
#
# Contrato de saída (o dos guardas do portfólio desde 2026-09-17): 0 passou · 3 RODOU e REPROVOU · outro = NÃO CONSEGUIU RODAR.
# Uso: check-licenca.sh [raiz-do-repo]
set -uo pipefail

RAIZ="${1:-$(git rev-parse --show-toplevel 2>/dev/null)}"
if [[ -z "$RAIZ" || ! -d "$RAIZ" ]]; then echo "check-licenca: nao achei a raiz do repositorio."; exit 2; fi
cd "$RAIZ" || exit 2
command -v node >/dev/null 2>&1 || { echo "check-licenca: node nao encontrado no PATH."; exit 2; }

falhas=()

# 1. LICENSE na raiz
if ! git cat-file -e :LICENSE 2>/dev/null; then
  falhas+=("LICENSE: nao existe na raiz (no indice).")
else
  texto="$(git show :LICENSE 2>/dev/null)" || { echo "check-licenca: nao consegui ler LICENSE do indice."; exit 2; }
  if ! grep -qi "todos os direitos reservados" <<<"$texto"; then
    falhas+=("LICENSE: nao diz \"Todos os direitos reservados\".")
  fi
  if grep -qiE "permission is hereby granted|gnu (affero |lesser )?general public license|apache license|redistribution and use in source and binary forms|permission to use, copy, modify" <<<"$texto"; then
    falhas+=("LICENSE: tem texto de licenca aberta (MIT, GPL, Apache, BSD ou ISC).")
  fi
fi

# 2. package.json rastreados
n=0
while IFS= read -r f; do
  [[ -z "$f" ]] && continue
  case "/$f" in */node_modules/*|*/fixtures/*|*/__fixtures__/*|/.claude/worktrees/*) continue ;; esac
  n=$((n+1))
  lic="$(git show ":$f" 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      try { const j=JSON.parse(s); process.stdout.write(j.license===undefined ? "<ausente>" : String(j.license)); }
      catch (e) { process.stdout.write("<json-invalido>"); }
    });')" || { echo "check-licenca: node falhou ao ler $f."; exit 2; }
  if [[ "$lic" == "<json-invalido>" ]]; then
    echo "check-licenca: $f nao e' JSON valido."; exit 2
  fi
  if [[ "$lic" != "UNLICENSED" && "$lic" != "SEE LICENSE IN LICENSE" ]]; then
    falhas+=("$f: \"license\" e' \"$lic\"; o esperado e' \"UNLICENSED\".")
  fi
done < <(git ls-files -- 'package.json' '**/package.json' 2>/dev/null)

if [[ ${#falhas[@]} -gt 0 ]]; then
  echo "[licenca] ✗ o repositorio nao se declara proprietario:"
  printf '  - %s\n' "${falhas[@]}"
  exit 3
fi
echo "[licenca] ✓ LICENSE proprietaria e $n package.json com \"UNLICENSED\"."
exit 0
