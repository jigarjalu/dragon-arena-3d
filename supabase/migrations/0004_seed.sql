-- 1. Seed Arenas
insert into public.arenas (slug, name, description, difficulty, model_key, unlock_level, unlock_coins, objective_weight)
values
  ('forest', 'Enchanted Forest', 'Lush emerald grass, mossy obstacles, flowers and drifting fireflies', 'beginner', 'forest_v1', 1, 0, 1000),
  ('desert', 'Desert Sands', 'Golden dunes, sandstone pillars, cacti and quicksand patches', 'intermediate', 'desert_v1', 3, 1000, 1500),
  ('lava', 'Magma Flow', 'Obsidian rock, glowing molten lava rivers and fiery ember haze', 'advanced', 'lava_v1', 6, 2500, 2000)
on conflict (slug) do nothing;

-- 2. Seed 8 Dragon Skins
insert into public.dragon_skins (slug, name, description, rarity, element, price_coins, price_gems, model_key)
values
  ('emerald', 'Emerald Dragon', 'The ancient forest guardian with agile gliding', 'epic', 'nature', 0, 0, 'emerald_drake'),
  ('candy', 'Candy Serpent', 'Sweet and bouncy, leaves sugary rainbow confetti trails', 'rare', 'sweet', 500, 0, 'candy_serpent'),
  ('golden', 'Golden Cobra', 'Forged in royal solar fire, shimmers with brilliance', 'legendary', 'electric', 1200, 5, 'golden_cobra'),
  ('ocean', 'Ocean Spirit', 'Born from deep sea currents, glides like running water', 'epic', 'water', 800, 0, 'ocean_wyrm'),
  ('magma', 'Magma Beast', 'Living volcanic core surrounded by dark igneous rock', 'legendary', 'fire', 1200, 5, 'magma_beast'),
  ('royal', 'Royal Knight', 'Cobalt plate armor and golden crests of valor', 'epic', 'royal', 800, 0, 'royal_knight'),
  ('crystal', 'Crystal Dragon', 'Grown in high-pressure subterranean geodes', 'rare', 'ice', 500, 0, 'crystal_wyrm'),
  ('rainbow', 'Rainbow Serpent', 'Prismatic spectrum master of supreme elegance', 'legendary', 'rainbow', 1200, 5, 'rainbow_lord')
on conflict (slug) do nothing;
