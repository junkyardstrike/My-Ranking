import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import FolderView from './views/FolderView';
import RankingView from './views/RankingView';
import AllRankingsView from './views/AllRankingsView';
import SettingsView from './views/SettingsView';

import StatsView from './views/StatsView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<FolderView />} />
          <Route path="folder/:folderId" element={<FolderView />} />
          <Route path="ranking/:rankingId" element={<RankingView />} />
          <Route path="all" element={<AllRankingsView />} />
          <Route path="stats" element={<StatsView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
