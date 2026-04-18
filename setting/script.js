export function init() {
  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });
}
