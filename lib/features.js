/**
 * Feature flags. Anything NOT in the launch range ships switched off.
 *
 *   NEXT_PUBLIC_FEATURE_CUSTOM_KIT=true   Design Studio + custom jersey (work in progress)
 *   NEXT_PUBLIC_FEATURE_GLOVES=true       goalkeeper gloves (long-term roadmap)
 *
 * Launch range: padded base layers, goalkeeper jerseys, pants, shorts,
 * athletic tape and grip socks. Flags are read statically so Next can inline
 * them at build time; change them in Vercel → Environment Variables and redeploy.
 */
const on = (value) => /^(1|true|on|yes)$/i.test(String(value || '').trim());

export const FEATURES = {
  customKit: on(process.env.NEXT_PUBLIC_FEATURE_CUSTOM_KIT),
  gloves: on(process.env.NEXT_PUBLIC_FEATURE_GLOVES),
};
