# Story 4.1: Dashboard candidatures envoyées avec statuts

Status: done

## Implémentation

- Route `/candidatures` (Server Component) avec liste paginée join `applications + offers + interview_preps`
- Server Action `listApplicationsAction({ statuses?, sort?, limit?, offset? })`
- Composants : `ApplicationsFilters` (filter multi-statuts via chips, tri 3 modes), `StatusBadge` (variants sémantiques : default/outline/destructive/secondary)
- Statuts UI : Envoyée, Lue, Réponse reçue, Entretien planifié, Signature 🎉, Refusée + statuts internes (En préparation, Lettre prête, À relire, Annulée, Échec)
- Empty state inline si 0 candidature
- Lib partagée `lib.ts` avec helpers `statusLabel`, `statusBadgeVariant`, `formatDateFr`

## V1 limitations

- Pas de TanStack Query : refetch via `router.refresh()` après Server Action (simpler V1)
- Pas de page détail `/candidatures/[id]` séparée (V2 — lettre + historique events accessibles via modal V2)
- Pagination simple (limit/offset), pas infinite scroll
- Filtres multi-select via chips, pas dropdown multi-checkbox

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
