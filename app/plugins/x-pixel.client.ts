export default defineNuxtPlugin(() => {
  if (process.env.NODE_ENV !== "production") return;

  const config = useRuntimeConfig();
  const pixelId = config.public.x_pixel_id;
  if (!pixelId) return;

  (function (e: any, t: Document, n: string, s: any, u: any, a: any) {
    e.twq ||
      ((s = e.twq =
        function () {
          s.exe ? s.exe.apply(s, arguments) : s.queue.push(arguments);
        }),
      (s.version = "1.1"),
      (s.queue = []),
      (u = t.createElement(n)),
      (u.async = true),
      (u.src = "https://static.ads-twitter.com/uwt.js"),
      (a = t.getElementsByTagName(n)[0]),
      a.parentNode.insertBefore(u, a));
  })(window, document, "script", undefined, undefined, undefined);

  (window as any).twq("config", pixelId);
});
