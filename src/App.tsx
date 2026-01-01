import { Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { HomePage } from "@/components/HomePage";
import { RepositoryView } from "@/components/RepositoryView";
import { NotFound } from "@/components/NotFound";

function App() {
  return (
    <Layout>
      <Routes>
        {/* Homepage */}
        <Route path="/" element={<HomePage />} />

        {/* Repository view - supports /r/owner/repo and /r/owner/repo/... */}
        <Route path="/r/:owner/:repo/*" element={<RepositoryView />} />
        <Route path="/r/:owner/:repo" element={<RepositoryView />} />

        {/* 404 for everything else */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

export default App;
