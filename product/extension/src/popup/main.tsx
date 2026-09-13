/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { DashboardState, ExtensionResponse } from '../messaging';
import { sendExtensionMessage } from '../messaging';
import '../dashboard/styles.css';

function Popup() {
  const [state, setState] = useState<DashboardState>();

  useEffect(() => {
    void sendExtensionMessage<ExtensionResponse>({ type: 'GET_DASHBOARD_STATE' }).then((response) => {
      if (response.ok && 'state' in response) setState(response.state);
    });
  }, []);

  const latest = state?.usageLogs[0];
  return (
    <main className="popup">
      <p className="eyebrow">Preference Intelligence</p>
      <h1>Your preferences. Every AI.</h1>
      <div className="current">
        <strong>{state?.settings.personalizationEnabled ? 'Personalization on' : 'Personalization paused'}</strong>
        {latest ? <><p>{latest.classification.domain.replaceAll('_', ' ')} · {latest.classification.task}</p><ul>{latest.decisions.filter((item) => item.status === 'used').slice(0, 4).map((item) => <li key={item.preferenceId}>{item.dimension.replaceAll('_', ' ')}: {item.value.replaceAll('_', ' ')}</li>)}</ul></> : <p>No prompts personalized yet.</p>}
      </div>
      <button onClick={() => void sendExtensionMessage({ type: 'OPEN_DASHBOARD' }).then(() => window.close())}>View and control profile</button>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Popup />);
