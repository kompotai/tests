# Claude Commands

## Доступные команды

### commit-push
Коммит и пуш всех изменений с проверками.

**Использование:**
```
/commit-push
```

**Что делает:**
- Проверяет безопасность (secrets, merge conflicts)
- Коммитит изменения на русском языке с английскими префиксами
- Проверяет TypeScript (`tsc --noEmit`)
- Делает pull и push
- Выводит summary

**Важные правила:**
- ✅ Коммиты на русском с типом на английском (test/feat/fix/docs/chore)
- ✅ БЕЗ GPG подписи (`--no-gpg-sign`)
- ✅ БЕЗ упоминания AI/Claude
- ❌ Никогда: `git stash`, `git rebase`, `git push --force`
- ❌ Не пушить с ошибками TypeScript
