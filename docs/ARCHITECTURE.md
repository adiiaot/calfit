# CalFit — Architecture

```mermaid
flowchart TD
  A[index.ts / App.tsx] --> B[AppNavigator: AuthStack vs AppStack]
  B --> C[TabNavigator: Home/Calorie/AICoach/Notes + hidden routes]
  C --> D[Zustand: auth/theme/aiCoach/mealPlan]
  D --> E[Supabase: Auth/PG/Realtime/Storage]
  C --> F[Edge proxies: ai-proxy / deepgram-proxy]
  F --> G[NVIDIA + Deepgram]
  C --> H[OFF API + local foods]
```

- Navigation: Stack + Tabs, custom bar + RadialMenu; gate `!user||isOnboarding`.
- Data flow: screens → services → Supabase; steps/AI via hooks/services; exports via Share/Print.
- Errors: per-screen try/catch + notifications; no global boundary (recommended).
