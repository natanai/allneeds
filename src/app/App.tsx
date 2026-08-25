import { Route, Routes } from 'react-router';

import { AlexithymiaSupportPage } from '../features/alexithymia/AlexithymiaSupportPage';
import { BodyCuesPage } from '../features/bodyCues/BodyCuesPage';
import { NeedMagnetAuditPage } from '../features/designLab/NeedMagnetAuditPage';
import { EmotionsWheelPage } from '../features/emotionsWheel/EmotionsWheelPage';
import { FauxFeelingDetailPage } from '../features/fauxFeelings/FauxFeelingDetailPage';
import { FauxFeelingsPage } from '../features/fauxFeelings/FauxFeelingsPage';
import { FeedPage } from '../features/feed/FeedPage';
import { FeelingDetailPage } from '../features/feelings/FeelingDetailPage';
import { FeelingsPage } from '../features/feelings/FeelingsPage';
import { HomePage } from '../features/home/HomePage';
import { InventoryPage } from '../features/inventory/InventoryPage';
import { JournalPage } from '../features/journal/JournalPage';
import { NeedDetailPage } from '../features/needs/NeedDetailPage';
import { NeedsPage } from '../features/needs/NeedsPage';
import { ObservationsPage } from '../features/observations/ObservationsPage';
import { PlaceholderPage } from '../features/shared/PlaceholderPage';
import { AppShell } from './AppShell';

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="feelings" element={<FeelingsPage />} />
        <Route path="feelings/body-cues" element={<BodyCuesPage />} />
        <Route path="feelings/emotions-wheel" element={<EmotionsWheelPage />} />
        <Route path="feelings/:slug" element={<FeelingDetailPage />} />
        <Route path="needs" element={<NeedsPage />} />
        <Route path="needs/:slug" element={<NeedDetailPage />} />
        <Route path="faux-feelings" element={<FauxFeelingsPage />} />
        <Route path="faux-feelings/:slug" element={<FauxFeelingDetailPage />} />
        <Route path="observations" element={<ObservationsPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="inventory/journal" element={<JournalPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="alexithymia-support" element={<AlexithymiaSupportPage />} />
        <Route path="design-lab/need-magnets" element={<NeedMagnetAuditPage />} />
        <Route
          path="*"
          element={
            <PlaceholderPage
              eyebrow="Not found"
              title="That page could not be found"
              description="Check the address, or use the navigation to return to the allneeds.app tools and reference pages."
            />
          }
        />
      </Route>
    </Routes>
  );
}
