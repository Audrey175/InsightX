console.log("DEBUG: utils.ts IS LOADED!");

export function cn(...classes: (string | undefined | null | false)[]) {
  console.log("DEBUG: cn() function called with:", classes);
  return classes.filter(Boolean).join(" ");
}
