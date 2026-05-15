/**
 * SwipeJob — Prettier config
 * Délègue à packages/config/prettier/base.js (source de vérité unique)
 * Note: Prettier ne résout pas les packages workspace dans les config files,
 * donc on utilise un chemin relatif vers le fichier source.
 */
import config from './packages/config/prettier/base.js';

export default config;
