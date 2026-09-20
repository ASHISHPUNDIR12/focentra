/** API failures may be HTML (a proxy, missing route, or Express error page). */
export async function readApiResponse<T>(response: Response, fallback: string): Promise<T> {
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json") && !contentType.includes("+json")) {
        throw new Error(fallback);
    }
    let data: unknown;
    try {
        data = await response.json();
    } catch {
        throw new Error(fallback);
    }
    if (!data || typeof data !== "object") throw new Error(fallback);
    if (!response.ok) {
        const message = "message" in data && typeof data.message === "string" ? data.message : fallback;
        throw new Error(message);
    }
    return data as T;
}
