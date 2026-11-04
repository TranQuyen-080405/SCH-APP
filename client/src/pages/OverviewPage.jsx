import { useCallback, useState } from "react";
import { useNavigate } from "react-router";
import OverviewPanel from "../components/OverviewPanel.jsx";
import { useTaskEditor } from "../hooks/useTaskEditor.jsx";

export default function OverviewPage() {
  const navigate = useNavigate();
  const [revision, setRevision] = useState(0);
  const reload = useCallback(async () => {
    setRevision((value) => value + 1);
    return true;
  }, []);
  const editor = useTaskEditor(reload);

  return (
    <>
      {editor.banner ? <div className="mb-6">{editor.banner}</div> : null}
      <OverviewPanel
        revision={revision}
        onOpen={editor.openEdit}
        onSeeAll={() => navigate("/tasks?status=done")}
      />
      {editor.ui}
    </>
  );
}
