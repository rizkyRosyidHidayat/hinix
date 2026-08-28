export const COMMON_PATTERNS = {
  list: [
    /\b(show|list|display|view)\b.*\b(task|tasks|todo|todos)\b/i,
    /\b(my|all)\s+(task|tasks|todo|todos)\b/i,
  ],
  confirmationWords: /\b(yes|confirm|okay|yeah|ok)\b/i,
  destructiveWords: /\b(delete|remove|cancel|stop)\b/i
};
