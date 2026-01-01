import { useLocation } from "react-router-dom";

function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">Hello World! 👋</h1>

        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-3">Current URL Path:</h2>
          <p className="text-2xl font-mono bg-white/20 rounded px-4 py-3 break-all">
            {location.pathname}
          </p>
        </div>

        <div className="mt-6 space-y-2 text-gray-600">
          <p className="text-sm">
            <span className="font-semibold">Search:</span>
            <span className="ml-2 font-mono">{location.search || "(none)"}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Hash:</span>
            <span className="ml-2 font-mono">{location.hash || "(none)"}</span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Full Path:</span>
            <span className="ml-2 font-mono">
              {location.pathname + location.search + location.hash}
            </span>
          </p>
        </div>

        <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-800">
            ✅ <strong>GitHub Pages SPA:</strong> This app is configured to work with GitHub Pages
            single page application routing!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
