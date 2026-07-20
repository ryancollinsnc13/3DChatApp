import { FormEvent, useState } from "react";
import { ArrowRight, Home, Sparkles } from "lucide-react";
import { useSessionStore } from "../../state/useSessionStore";

export function DevLogin() {
  const [displayName, setDisplayName] = useState("Ryan");
  const login = useSessionStore((state) => state.login);
  const isLoading = useSessionStore((state) => state.isLoading);
  const error = useSessionStore((state) => state.error);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void login(displayName);
  };

  return (
    <main className="min-h-screen bg-life-sky text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-5 py-8">
        <section className="rounded-lg border-2 border-ink bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase text-moss">3D House Prototype</p>
              <h1 className="mt-2 text-3xl font-black">Dev Login</h1>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-mint text-moss">
              <Home aria-hidden="true" size={28} />
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="text-sm font-semibold text-ink/75">Display name</span>
              <input
                className="mt-2 w-full rounded-md border border-ink/15 bg-paper px-4 py-3 text-base font-semibold outline-none transition focus:border-moss focus:ring-4 focus:ring-mint"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Choose a name"
                data-testid="login-name"
              />
            </label>
            {error ? <p className="text-sm font-semibold text-coral">{error}</p> : null}
            <button
              className="flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-3 font-bold text-white transition hover:bg-moss disabled:cursor-not-allowed disabled:opacity-60"
              type="submit"
              disabled={isLoading}
              data-testid="login-submit"
            >
              <Sparkles aria-hidden="true" size={18} />
              {isLoading ? "Opening..." : "Enter house"}
              <ArrowRight aria-hidden="true" size={18} />
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
