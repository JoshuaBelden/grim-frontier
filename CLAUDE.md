# Grim Frontier

Persistent async western world simulation. See [docs/concept.md](docs/concept.md) for full design concepts and world-building details.

## Formatting

All code must conform to `.prettierrc`:

- 2-space indentation, no tabs
- No semicolons
- No parentheses around single arrow function parameters
- 120 character print width

## TypeScript Conventions

### Prefer interfaces over type aliases for object shapes

```ts
// Preferred
interface UserAccount {
  id: string
  name: string
}

// Avoid
type UserAccount = {
  id: string
  name: string
}
```

### Use union string literals instead of large enums or classes for constrained sets

```ts
// Preferred
type AccountType = 'checking' | 'savings' | 'loan' | 'asset'

// Avoid
class AccountType { ... }
```

### Enums use PascalCase for both the enum name and members

```ts
enum FrequencyType {
  Weekly,
  Biweekly,
  Monthly,
}
```

### Avoid single or two-character variable names

Short abbreviations like `tx`, `ac`, `fn`, `cb` are not allowed. Use descriptive but concise names.

```ts
// Preferred
transactions.filter(transaction => transaction.amount > 0)

// Avoid
transactions.filter(tx => tx.amount > 0)
```

Exceptions: loop indices (`i`, `j`) and well-understood math variables are acceptable only when scope is trivially small (1–2 lines).

## Comments

### Types and interfaces

Add a JSDoc comment describing the purpose. Do not describe individual fields unless they are non-obvious.

```ts
/** Represents a scheduled recurring bill tied to a paycheck cycle. */
interface Bill {
  id: string
  name: string
  amount: number
  frequency: BillFrequency
}
```

### Functions

Add a JSDoc comment describing what the function does, not how. Include `@param` or `@returns` only when the signature alone is unclear.

```ts
/** Computes all pay dates for a paycheck within a given calendar month. */
function getPayDaysInMonth(paycheck: Paycheck, month: Date): Date[] { ... }
```

### Inline comments

Only add inline comments when the logic is genuinely non-obvious — not for every line. Never add comments that describe recent changes (no "// added X" or "// updated to handle Y").

## Shared Package Type Organization

Types in `packages/shared/src/` are split into focused files by domain, with `index.ts` re-exporting everything. Each file should contain one cohesive group of related types.

When adding new types, place them in the most relevant existing file or create a new focused file. Never add types directly to `index.ts`.

## SvelteKit Conventions

- Stores are Svelte writable stores and auto-persist to localStorage via `saveToStorage`.
- `budgetStore` exposes `.categories` and `.overrides` sub-stores — do not treat it as a direct store.
- All localStorage keys use the `accountly:` prefix.
- Components go under `src/lib/components/<domain>/`, routes under `src/routes/<page>/`.
- Use `$lib/` path aliases for all internal imports.
- Avoid putting business logic in `.svelte` files — keep it in stores or utils.
- Prefer `on:click` handlers that call named functions over inline logic in templates.

## Git Commits

Use imperative summary style — write the title as if completing the sentence "This commit will...".

- Title: short, imperative, no period — e.g. `Add bill recurrence validation`, `Fix loan balance calculation`
- Do not review git history to match previous style
- Body (optional): explain _why_ if the reason isn't obvious from the title, not _what_ changed
- No co-author lines, no generated footers

```
Add transaction filtering by date range

Needed to support the planner's monthly view without loading all transactions.
```

## General

- Prefer explicit types over `any`. Use `unknown` with narrowing when the type is genuinely uncertain.
- Do not add backwards-compatibility shims, unused exports, or `// removed` comments for deleted code.
- Do not over-engineer. Solve the current problem with the minimum necessary abstraction.
- Do not add error handling for scenarios that cannot happen given internal guarantees.
