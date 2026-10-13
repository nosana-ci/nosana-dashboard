import { computed, ref } from "vue";

/** Nosa's dashboard persona, as the playground runs it on any model. */
export type NosaProfile = {
  id: string;
  description: string;
  /** The system prompt as Nosa's own chat sends it. */
  system: string;
  /** The markdown behind the official links tool. */
  officialLinks: string;
};

type Persona = { id: string; description: string; systemPrompt: string; officialLinks: string };

const persona = ref<Persona | null>(null);
const error = ref<string | null>(null);
const loading = ref(false);

/**
 * Nosa's persona from its backend, the prompt admins edit, loaded once per page
 * with the dashboard session.
 */
export const useNosaProfile = (nosaUrl?: string) => {
  async function load() {
    if (!nosaUrl || persona.value || loading.value) return;
    loading.value = true;
    error.value = null;
    try {
      const response = await fetch(`${nosaUrl}/dashboard/persona`, { credentials: "include" });
      if (!response.ok) throw new Error(`Nosa's persona: HTTP ${response.status}`);
      persona.value = (await response.json()) as Persona;
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading.value = false;
    }
  }

  const profile = computed<NosaProfile | null>(() => {
    const p = persona.value;
    if (!p) return null;
    const today = new Date().toISOString().slice(0, 10);
    return {
      id: p.id,
      description: p.description,
      system: `${p.systemPrompt}\n\nToday's date: ${today}.`,
      officialLinks: p.officialLinks,
    };
  });

  return { profile, error, loading, load };
};
