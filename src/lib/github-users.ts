import type { UserRecord } from "./auth";

const apiBase = "https://api.github.com";
function config() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const path = process.env.GITHUB_USERS_PATH || "database/users.json";
  if (!token || !owner || !repo) throw new Error("Konfigurasi GitHub belum lengkap. Atur GITHUB_TOKEN, GITHUB_OWNER, dan GITHUB_REPO.");
  return { token, owner, repo, path };
}
function headers(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "Content-Type": "application/json" };
}
async function getFile() {
  const c = config();
  const url = `${apiBase}/repos/${c.owner}/${c.repo}/contents/${c.path.split("/").map(encodeURIComponent).join("/")}`;
  const response = await fetch(url, { headers: headers(c.token), cache: "no-store" });
  if (response.status === 404) return { users: [] as UserRecord[], sha: undefined as string | undefined };
  if (!response.ok) throw new Error(`GitHub membaca database gagal (${response.status}). Pastikan repo/path dan token benar.`);
  const file = await response.json();
  const decoded = Buffer.from(file.content || "", "base64").toString("utf8");
  const parsed = JSON.parse(decoded || '{"users":[]}');
  return { users: (Array.isArray(parsed) ? parsed : parsed.users || []) as UserRecord[], sha: file.sha as string };
}
export async function findUser(username: string) {
  const { users } = await getFile();
  return users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
}
export async function addUser(user: UserRecord) {
  const c = config();
  const { users, sha } = await getFile();
  if (users.some(u => u.username.toLowerCase() === user.username.toLowerCase())) return false;
  users.push(user);
  const url = `${apiBase}/repos/${c.owner}/${c.repo}/contents/${c.path.split("/").map(encodeURIComponent).join("/")}`;
  const body: Record<string, string> = {
    message: `Valen Crash: register ${user.username}`,
    content: Buffer.from(JSON.stringify({ users }, null, 2) + "\n").toString("base64")
  };
  if (sha) body.sha = sha;
  const response = await fetch(url, { method: "PUT", headers: headers(c.token), body: JSON.stringify(body), cache: "no-store" });
  if (response.status === 409 || response.status === 422) throw new Error("Database berubah bersamaan. Coba register lagi.");
  if (!response.ok) throw new Error(`GitHub menyimpan akun gagal (${response.status}). Pastikan token punya izin Contents: Read and write.`);
  return true;
}
