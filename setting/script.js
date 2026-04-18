export function init() {
  import("https://esm.sh/lucide").then(({ createIcons, icons }) => {
    createIcons({ icons });
  });

  const $ = id => document.getElementById(id);

  let UIs = {
    weapon: $('weapon'),
    match: $('match')
  };
}
