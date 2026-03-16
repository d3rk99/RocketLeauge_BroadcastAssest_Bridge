const API_BASE = window.ISU_RL_API_BASE || "http://localhost:8000";
const API_KEY = window.ISU_RL_API_KEY || "dev-api-key";
export async function postEvent(event, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await fetch(`${API_BASE}/ingest`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY,
                },
                body: JSON.stringify(event),
            });
            if (!response.ok) {
                throw new Error(`Ingest failed with status ${response.status}`);
            }
            return;
        }
        catch (error) {
            console.warn(`[ISU RL API] ingest attempt ${attempt} failed`, error);
            if (attempt === retries) {
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, attempt * 500));
        }
    }
}
