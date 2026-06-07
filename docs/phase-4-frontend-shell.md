# Phase 4 — Frontend Shell

## What we built

A complete React frontend shell: Redux Toolkit state management, Axios API services, MUI dark-themed layout with sidebar navigation, and 5 pages — Dashboard, Projects, Project Detail, Deployments, and a live Deployment log viewer that polls the API.

---

## Folder Structure

```
frontend/src/
├── api/
│   ├── client.js          ← Axios instance (baseURL + error interceptor)
│   ├── projects.js        ← CRUD wrappers for /projects
│   ├── deployments.js     ← list/get wrappers for /deployments
│   └── terraform.js       ← plan/apply/destroy/workspace wrappers
├── store/
│   ├── index.js           ← configureStore with all reducers
│   └── slices/
│       ├── projectsSlice.js
│       └── deploymentsSlice.js
├── components/
│   ├── Layout/
│   │   ├── Layout.jsx     ← Sidebar + Header + content wrapper
│   │   ├── Sidebar.jsx    ← Permanent MUI Drawer with active-state nav
│   │   └── Header.jsx     ← AppBar with page title
│   └── common/
│       ├── StatusChip.jsx ← Color-coded chip for all status values
│       └── EmptyState.jsx ← Reusable zero-state placeholder
└── pages/
    ├── Dashboard.jsx      ← Stats cards + recent projects/deployments
    ├── Projects.jsx       ← Project list + create dialog
    ├── ProjectDetail.jsx  ← Project info + deployments table
    ├── Deployments.jsx    ← Global deployments list
    ├── DeploymentDetail.jsx ← Live log viewer with polling
    ├── NewDeployment.jsx  ← AWS resource configurator (Phase 5)
    └── NotFound.jsx
```

---

## Key Concepts

### Redux Toolkit — createAsyncThunk

```js
export const fetchProjects = createAsyncThunk("projects/fetchAll", async (params) => {
  const res = await projectsApi.list(params);
  return res.data;
});
```

`createAsyncThunk` handles the `pending → fulfilled → rejected` lifecycle automatically. In the slice's `extraReducers`, we handle each:

```js
.addCase(fetchProjects.pending,   (state) => { state.loading = true })
.addCase(fetchProjects.fulfilled, (state, action) => { state.items = action.payload.items })
.addCase(fetchProjects.rejected,  (state, action) => { state.error = action.error.message })
```

**Why not use React Query or SWR?** Redux Toolkit is already in the stack. For a dashboard that shares state across many pages (e.g., dashboard shows same deployments as the deployments page), a global store avoids prop drilling and duplicate fetches.

---

### Layout Pattern

```jsx
export default function Layout({ title, children }) {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <Header title={title} />
        <Box sx={{ p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
```

Every page wraps its content in `<Layout title="Page Name">`. The sidebar is a **permanent Drawer** (always visible on desktop), which means it doesn't overlay content — the main area flexes to fill the remaining space.

---

### Live Log Polling (`DeploymentDetail.jsx`)

```js
useEffect(() => {
  if (deployment.status === "running" || deployment.status === "pending") {
    pollRef.current = setInterval(async () => {
      const res = await deploymentsApi.get(id);
      dispatch(updateDeploymentInList(res.data));
      if (res.data.status !== "running" && res.data.status !== "pending") {
        clearInterval(pollRef.current);
      }
    }, 2000);
  }
  return () => clearInterval(pollRef.current);
}, [deployment?.status]);
```

Every **2 seconds**, the frontend fetches the latest deployment from the API. When the status changes from `running` to `success` or `failed`, polling stops automatically.

**Why polling instead of WebSockets?** Polling is stateless — no persistent connection to manage, no reconnect logic, works behind any proxy. For a first version it's correct. WebSocket streaming would be Phase 9 (real-time log streaming).

**`useRef` for the interval ID** — we use `useRef` instead of `useState` because changing the interval ID should NOT trigger a re-render.

---

### StatusChip — Centralised Status Display

```js
const STATUS_MAP = {
  success: { color: "success", label: "Success" },
  failed:  { color: "error",   label: "Failed" },
  running: { color: "info",    label: "Running" },
  ...
};
```

All status displays in the app go through one component. If we rename a status value later, we change it once here instead of hunting through every page.

---

## Interview Talking Points

**Q: Why Redux over local component state?**
Dashboard needs to show the count of deployments. DeploymentDetail needs the same data as Deployments list. With local state they'd both fetch independently and could be out of sync. Redux gives a single source of truth — update once, every component that subscribes sees it.

**Q: What's the difference between `useRef` and `useState`?**
`useState` triggers a re-render when updated — right for values that affect what the UI shows. `useRef` holds a mutable value without triggering re-renders — right for interval IDs, DOM nodes, and previous-value tracking that only the component logic needs.

**Q: Why 2-second polling intervals?**
Terraform init/plan/apply can each take 10–60 seconds. 2 seconds gives near-real-time feedback without hammering the API. The polling stops as soon as the terminal status is detected, so there's no steady-state load.

---

## What's Next — Phase 5

Build the `NewDeployment` page with service-specific forms (EC2, S3, VPC), a resource builder UI that assembles the JSON payload, and the HCL preview pane before triggering plan/apply.
