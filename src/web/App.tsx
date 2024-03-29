import { enableReactTracking } from "@legendapp/state/config/enableReactTracking";
import { configureObservablePersistence } from "@legendapp/state/persist";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { Toaster } from "react-hot-toast";
import { Route, HashRouter as Router, Routes } from "react-router-dom";
import {
  Collection,
  EditCollection,
  EditIssue,
  FirstLaunch,
  Issue,
  Library,
  Settings,
} from "./pages";

enableReactTracking({ auto: true, warnUnobserved: true });

configureObservablePersistence({
  pluginLocal: ObservablePersistLocalStorage,
});

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Library />} />
        <Route path="/:issueId" element={<Issue />} />
        <Route path="/editIssue/:issueId" element={<EditIssue />} />
        <Route path="/collections/:collectionId" element={<Collection />} />
        <Route path="/first_launch" element={<FirstLaunch />} />
        <Route
          path="/collections/edit/:collectionId"
          element={<EditCollection />}
        />
        <Route path="/settings" element={<Settings />} />
      </Routes>
      <Toaster
        position="bottom-right"
        containerStyle={{
          top: 30,
        }}
        toastOptions={{
          style: {
            padding: 5,
            fontSize: 13,
            fontWeight: 500,
            color: "#FFFFFF",
            background: "#1C1C1C",
          },
        }}
      />
    </Router>
  );
};
