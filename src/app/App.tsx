import { Route, Routes } from 'react-router';

import { FeelingsPage } from '../features/feelings/FeelingsPage';
import { HomePage } from '../features/home/HomePage';
import { PlaceholderPage } from '../features/shared/PlaceholderPage';
import { AppShell } from './AppShell';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="feelings" element={<FeelingsPage />} />
        <Route
          path="feelings/body-cues"
          element={
            <PlaceholderPage
              eyebrow="Tool"
              title="Body cues"
              description="This route is reserved for a mobile-first rebuild of the body-cue → possible-feeling inference tool."
            />
          }
        />
        <Route
          path="feelings/:slug"
          element={
            <PlaceholderPage
              eyebrow="Feeling"
              title="Feeling detail"
              description="Legacy feeling slugs are reserved here so V2 can retain useful public deep links as content is migrated."
            />
          }
        />
        <Route
          path="needs"
          element={
            <PlaceholderPage
              eyebrow="Reference"
              title="Needs"
              description="The first V2 content slice will bring the canonical needs catalog, evidence, and related-content links into this route."
            />
          }
        />
        <Route
          path="needs/:slug"
          element={
            <PlaceholderPage
              eyebrow="Need"
              title="Need detail"
              description="Legacy need slugs are reserved here so evidence-rich reference pages can keep sensible, shareable URLs."
            />
          }
        />
        <Route
          path="faux-feelings"
          element={
            <PlaceholderPage
              eyebrow="Reference"
              title="Faux feelings"
              description="This route is reserved for the faux-feelings catalog and its connections to feelings and needs."
            />
          }
        />
        <Route
          path="faux-feelings/:slug"
          element={
            <PlaceholderPage
              eyebrow="Faux feeling"
              title="Faux-feeling detail"
              description="V2 will preserve useful legacy slugs without reproducing the legacy generated-page architecture."
            />
          }
        />
        <Route
          path="observations"
          element={
            <PlaceholderPage
              eyebrow="Tool"
              title="Observations"
              description="The observation editor will be rebuilt around the existing domain logic rather than porting the current page script wholesale."
            />
          }
        />
        <Route
          path="inventory"
          element={
            <PlaceholderPage
              eyebrow="Personal data"
              title="Strategy inventory"
              description="The strategy inventory will return behind a versioned persistence boundary with explicit legacy import support."
            />
          }
        />
        <Route
          path="inventory/journal"
          element={
            <PlaceholderPage
              eyebrow="Personal data"
              title="Journal"
              description="Journal migration will preserve on-device privacy while separating V2's internal model from older persisted formats."
            />
          }
        />
        <Route
          path="alexithymia-support"
          element={
            <PlaceholderPage
              eyebrow="Guided support"
              title="Alexithymia support"
              description="This flow will be rebuilt with progressive disclosure, reusing the strongest body-cue and inference logic without overwhelming the screen."
            />
          }
        />
        <Route
          path="*"
          element={
            <PlaceholderPage
              eyebrow="Not found"
              title="That page is not in V2 yet"
              description="V2 is being rebuilt in small slices. Use the navigation to return to a route that has already been reserved."
            />
          }
        />
      </Route>
    </Routes>
  );
}
