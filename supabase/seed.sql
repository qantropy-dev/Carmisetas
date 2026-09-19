-- ============================================================================
--  GENERADO por `npm run seed:sql` desde supabase/seed-data.ts — no editar.
-- ============================================================================

begin;

truncate table
  public.product_collections, public.product_images, public.product_variants,
  public.product_colors, public.products, public.collections, public.categories
restart identity cascade;

insert into public.categories (id, name, slug, sort_order) values
  ('1f6c8d28-2091-522f-9baa-387d8e41d30a', 'Camisetas', 'camisetas', 0),
  ('4f783c25-2038-5c48-91a6-2f34e90a6b0f', 'Suéteres', 'sueteres', 1);

insert into public.collections (id, name, slug, sort_order) values
  ('38fdee64-482e-54b2-8c35-e2d98990c792', 'Esencial', 'esencial', 0),
  ('97b3f145-2858-5fc7-9993-470f2ec5a588', 'Nocturno', 'nocturno', 1),
  ('de2c6fd4-5c6d-51e1-8dab-be0d28b1f437', 'Tejido', 'tejido', 2),
  ('d4934a4e-59e5-55b9-88c4-25374908a092', 'Archivo', 'archivo', 3);

insert into public.products (id, name, slug, headline, description, category_id,
  base_price, compare_at_price, fit, material, care, is_active, is_featured, sort_order) values
  ('4dda4d29-80fc-589e-8e33-050a61385283', 'Camiseta Bruma', 'camiseta-bruma', 'El peso justo del algodón', 'Jersey de 240 g tejido en Medellín. Hombro caído, cuerpo recto y un cuello acanalado que no se abre con el uso. La prenda base de todo lo demás.', '1f6c8d28-2091-522f-9baa-387d8e41d30a', 89900, null, 'Oversize · hombro caído', '100% algodón peinado 240 g/m²', 'Lavar a máquina en frío del revés. No usar secadora. Planchar a temperatura media.', true, true, 0),
  ('165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'Camiseta Sereno', 'camiseta-sereno', 'Corte recto, caída limpia', 'Silueta boxy de cuerpo corto y manga ancha. Teñida en prenda para que el color asiente parejo y envejezca bien.', '1f6c8d28-2091-522f-9baa-387d8e41d30a', 94900, 119900, 'Boxy · cuerpo corto', '100% algodón orgánico 220 g/m², teñido en prenda', 'Lavar a máquina en frío con colores similares. Secar a la sombra.', true, true, 1),
  ('07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'Camiseta Señal', 'camiseta-senal', 'Un solo color, dicho fuerte', 'La más pesada de la línea: 280 g que se sostienen solos. Costura lateral reforzada y bajo con dobladillo doble.', '1f6c8d28-2091-522f-9baa-387d8e41d30a', 99900, null, 'Regular · estructura firme', '100% algodón 280 g/m²', 'Lavar a máquina en frío. No usar blanqueador. Secar en plano.', true, true, 2),
  ('73e96e79-40f3-59c1-acfa-606161803e53', 'Suéter Salvia', 'sueter-salvia', 'Tejido que respira', 'Punto medio en algodón y lana merino. Cuello redondo acanalado, puños y bajo elásticos. Abriga sin abultar.', '4f783c25-2038-5c48-91a6-2f34e90a6b0f', 189900, null, 'Regular · caída suave', '70% algodón · 30% lana merino', 'Lavar a mano en frío o ciclo lana. Secar en plano a la sombra.', true, true, 3),
  ('b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'Suéter Nocturno', 'sueter-nocturno', 'Para cuando baja la luz', 'Capucha forrada, cordón plano y bolsillo canguro con apertura lateral. El felpado interior se cepilla para que no apelmace.', '4f783c25-2038-5c48-91a6-2f34e90a6b0f', 219900, 259900, 'Oversize · capucha estructurada', '80% algodón · 20% poliéster reciclado, felpa 400 g/m²', 'Lavar a máquina en frío del revés. No planchar sobre la estampación.', true, true, 4),
  ('87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'Cardigan Tejido', 'cardigan-tejido', 'La capa que falta', 'Ochos trenzados a lo largo del delantero y botones de corozo. Se lleva abierto sobre cualquier camiseta de la línea.', '4f783c25-2038-5c48-91a6-2f34e90a6b0f', 239900, null, 'Relajado · largo a la cadera', '60% algodón · 40% alpaca', 'Lavar a mano en frío. No retorcer. Secar en plano.', true, false, 5);

insert into public.product_collections (product_id, collection_id, sort_order) values
  ('4dda4d29-80fc-589e-8e33-050a61385283', '38fdee64-482e-54b2-8c35-e2d98990c792', 0),
  ('4dda4d29-80fc-589e-8e33-050a61385283', 'd4934a4e-59e5-55b9-88c4-25374908a092', 1),
  ('165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '38fdee64-482e-54b2-8c35-e2d98990c792', 0),
  ('165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '97b3f145-2858-5fc7-9993-470f2ec5a588', 1),
  ('07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'd4934a4e-59e5-55b9-88c4-25374908a092', 0),
  ('73e96e79-40f3-59c1-acfa-606161803e53', 'de2c6fd4-5c6d-51e1-8dab-be0d28b1f437', 0),
  ('73e96e79-40f3-59c1-acfa-606161803e53', '38fdee64-482e-54b2-8c35-e2d98990c792', 1),
  ('b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '97b3f145-2858-5fc7-9993-470f2ec5a588', 0),
  ('b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'de2c6fd4-5c6d-51e1-8dab-be0d28b1f437', 1),
  ('87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'de2c6fd4-5c6d-51e1-8dab-be0d28b1f437', 0),
  ('87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'd4934a4e-59e5-55b9-88c4-25374908a092', 1);

insert into public.product_colors (id, product_id, color_name, swatch_hex, ambient_hex, cutout_url, sort_order) values
  ('b476b54b-bf3e-5300-a949-74d1f37b0382', '4dda4d29-80fc-589e-8e33-050a61385283', 'Hueso', '#F2ECE1', '#DFD5C4', '/seed/camiseta-bruma-hueso-frente.png', 0),
  ('ac8c2764-1ab6-5e7c-99af-07b30575aa03', '4dda4d29-80fc-589e-8e33-050a61385283', 'Arena', '#D9C6AB', '#EEE4D3', '/seed/camiseta-bruma-arena-frente.png', 1),
  ('ef7890f8-35c5-5b04-9028-908205110b74', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'Niebla', '#B9C9D6', '#D7E1E8', '/seed/camiseta-sereno-niebla-frente.png', 0),
  ('13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'Carbón', '#33363B', '#1C1E22', '/seed/camiseta-sereno-carbon-frente.png', 1),
  ('a70f0edf-2b64-5eac-89af-25dd06f9f319', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'Terracota', '#C06A4E', '#D78F72', '/seed/camiseta-senal-terracota-frente.png', 0),
  ('9ea22b8d-fde0-5329-a809-aa54b78b22ac', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'Hueso', '#F2ECE1', '#DFD5C4', '/seed/camiseta-senal-hueso-frente.png', 1),
  ('13d59aa4-2745-5520-821e-8437d30a473f', '73e96e79-40f3-59c1-acfa-606161803e53', 'Salvia', '#B2C0A8', '#CED7C5', '/seed/sueter-salvia-salvia-frente.png', 0),
  ('add56888-318a-5ddc-92b6-7b9e45d3d941', '73e96e79-40f3-59c1-acfa-606161803e53', 'Crema', '#EFE4CF', '#DBCCAF', '/seed/sueter-salvia-crema-frente.png', 1),
  ('789f53c2-2b54-59b9-92c7-47a6653d7a29', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'Carbón', '#33363B', '#1C1E22', '/seed/sueter-nocturno-carbon-frente.png', 0),
  ('ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'Vino', '#6B3742', '#452229', '/seed/sueter-nocturno-vino-frente.png', 1),
  ('9fd259e3-a2c9-5fe6-8e94-914b364f6bda', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'Camel', '#C49A6A', '#E1C49C', '/seed/cardigan-tejido-camel-frente.png', 0),
  ('270de2c5-327f-5107-9ce0-b6c60872e6d3', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'Perla', '#DBD8D3', '#C2BEB7', '/seed/cardigan-tejido-perla-frente.png', 1),
  ('f3ed48cc-0226-56a0-bc77-586bd5d20791', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'Carbón', '#33363B', '#1C1E22', '/seed/cardigan-tejido-carbon-frente.png', 2);

insert into public.product_variants (id, product_id, color_id, size, sku, price_override, stock_status, is_active) values
  ('6d22c2da-2b5e-5de1-affb-d1d35ffa06db', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', 'S', 'BRUMA-HUE-S', null, 'disponible', true),
  ('2b3b6baa-4b60-5d6b-925f-a33cd587a308', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', 'M', 'BRUMA-HUE-M', null, 'disponible', true),
  ('860dace5-cc41-5912-b780-c89d5f793d23', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', 'L', 'BRUMA-HUE-L', null, 'disponible', true),
  ('e1b09222-0dd1-5dc6-80a1-589a9d588928', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', 'XL', 'BRUMA-HUE-XL', null, 'disponible', true),
  ('a59c4211-b4e4-53a2-8c50-ab28d7f73cc5', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', 'XXL', 'BRUMA-HUE-XXL', null, 'pocas', true),
  ('41a90ab9-f8dd-5733-bfec-580dabbf0db3', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', 'S', 'BRUMA-ARE-S', null, 'agotado', true),
  ('b2cd6ff3-3bc2-5e3b-b94a-9ecbb72ab7fa', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', 'M', 'BRUMA-ARE-M', null, 'disponible', true),
  ('e717d8fa-05f5-51d0-b3d0-b6becdfc5287', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', 'L', 'BRUMA-ARE-L', null, 'disponible', true),
  ('74293db8-de2f-56c9-bccf-a31b587cae54', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', 'XL', 'BRUMA-ARE-XL', null, 'disponible', true),
  ('e352bec5-ab53-5959-b3aa-f4804e24dc70', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', 'XXL', 'BRUMA-ARE-XXL', null, 'disponible', true),
  ('ebbc8980-5eb3-528f-9ba2-3258662babdd', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', 'S', 'SERENO-NIE-S', null, 'disponible', true),
  ('2b133823-994a-555a-97bb-58cf4ee6756e', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', 'M', 'SERENO-NIE-M', null, 'disponible', true),
  ('fba71b03-ea35-57b1-b111-ecceb8545077', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', 'L', 'SERENO-NIE-L', null, 'disponible', true),
  ('2396d35a-ce2e-5a9d-ac09-2cfa6f3017e4', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', 'XL', 'SERENO-NIE-XL', null, 'disponible', true),
  ('907daa41-bf5e-52d3-be8e-d3eca8f3238c', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', 'XXL', 'SERENO-NIE-XXL', null, 'disponible', true),
  ('679d0e65-125b-52ed-a8ed-b682301b151d', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', 'S', 'SERENO-CAR-S', null, 'pocas', true),
  ('911a747f-59a6-5f0a-a40e-ac617ae7e378', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', 'M', 'SERENO-CAR-M', null, 'disponible', true),
  ('4eb3e86e-27a2-5245-8bc2-5e40769d491e', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', 'L', 'SERENO-CAR-L', null, 'disponible', true),
  ('cd3202f6-1256-5c64-b976-e09f6902edcb', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', 'XL', 'SERENO-CAR-XL', null, 'disponible', true),
  ('3ab6eec5-dd22-51a0-93e3-dbd2087da03c', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', 'XXL', 'SERENO-CAR-XXL', null, 'agotado', true),
  ('65329731-0506-5d25-b956-d613c9a3c0d2', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', 'S', 'SENAL-TER-S', null, 'disponible', true),
  ('c90f7afb-4e71-5ea2-b871-4bd23b72c1b9', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', 'M', 'SENAL-TER-M', null, 'disponible', true),
  ('f874a126-6871-545e-ba88-a9f4723afef4', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', 'L', 'SENAL-TER-L', null, 'disponible', true),
  ('880b5b4f-eaf1-528b-9f04-8cbdf8aad9c4', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', 'XL', 'SENAL-TER-XL', null, 'disponible', true),
  ('bb20990a-d1dc-55c0-9a12-87bb7288b468', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', 'XXL', 'SENAL-TER-XXL', null, 'disponible', true),
  ('1f36a871-adb7-5de2-907f-5a67bb734ba2', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', 'S', 'SENAL-HUE-S', null, 'disponible', true),
  ('d04ea821-5a7b-5f87-b12b-7bae93f9369f', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', 'M', 'SENAL-HUE-M', null, 'pocas', true),
  ('e027eab4-7ef1-56c6-997c-2dc103c17afc', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', 'L', 'SENAL-HUE-L', null, 'disponible', true),
  ('2dba79a4-1a9c-56b8-9b20-ba8fe83e6a16', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', 'XL', 'SENAL-HUE-XL', null, 'disponible', true),
  ('e8caf1e8-06b6-5ed0-bed2-9bcc00ffe07d', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', 'XXL', 'SENAL-HUE-XXL', null, 'disponible', true),
  ('d3b5f79c-79ec-574f-9a6a-660c33a31cd7', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', 'S', 'SALVIA-SAL-S', null, 'disponible', true),
  ('59b7a8bc-ae95-5fdd-a624-3f7a06e9edfd', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', 'M', 'SALVIA-SAL-M', null, 'disponible', true),
  ('86dab68e-1e09-55f1-b39e-a192987a7b0a', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', 'L', 'SALVIA-SAL-L', null, 'disponible', true),
  ('dedb7cf2-1126-5881-bb47-985137ece435', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', 'XL', 'SALVIA-SAL-XL', null, 'disponible', true),
  ('ecedf47b-a799-56c5-bd2b-3dd0e9eea97c', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', 'XXL', 'SALVIA-SAL-XXL', null, 'disponible', true),
  ('4a38e28b-d217-5c9c-940b-28de89f6e90f', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', 'S', 'SALVIA-CRE-S', null, 'pocas', true),
  ('a9a627d6-fdff-5b78-b72b-77e4b9fbbc8f', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', 'M', 'SALVIA-CRE-M', null, 'disponible', true),
  ('95013695-2aa8-54e8-9fce-702094a63741', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', 'L', 'SALVIA-CRE-L', null, 'disponible', true),
  ('6f47c3d6-1abf-54f8-881e-f75447528121', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', 'XL', 'SALVIA-CRE-XL', null, 'agotado', true),
  ('8c9d56b6-06f7-515e-a45b-f154097ae3da', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', 'XXL', 'SALVIA-CRE-XXL', null, 'disponible', true),
  ('8d415132-e2c9-509a-aab5-df1c7af824a5', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', 'S', 'NOCTURNO-CAR-S', null, 'disponible', true),
  ('21f82856-bc0d-5f88-a294-382868fc218d', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', 'M', 'NOCTURNO-CAR-M', null, 'disponible', true),
  ('0e6f7382-abff-555e-9b17-059d953e2c09', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', 'L', 'NOCTURNO-CAR-L', null, 'disponible', true),
  ('2da94922-2264-5603-b094-8c88b400afee', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', 'XL', 'NOCTURNO-CAR-XL', null, 'disponible', true),
  ('6c96bcea-51fc-581c-a949-f939b466bc5c', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', 'XXL', 'NOCTURNO-CAR-XXL', null, 'disponible', true),
  ('4f943893-abab-52ea-aee3-04b4099c41cd', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'S', 'NOCTURNO-VIN-S', null, 'disponible', true),
  ('ed80b473-a498-5e88-bf36-4bc8baf7a833', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'M', 'NOCTURNO-VIN-M', null, 'disponible', true),
  ('9b28c4d5-316d-5d30-a465-12967688fea3', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'L', 'NOCTURNO-VIN-L', null, 'disponible', true),
  ('d4272c29-54f5-59f2-a856-eed68b59fe6b', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'XL', 'NOCTURNO-VIN-XL', null, 'disponible', true),
  ('407e8a5e-8bdd-5fea-bd9a-45d154626ed3', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', 'XXL', 'NOCTURNO-VIN-XXL', null, 'agotado', true),
  ('d9399330-5172-5505-98cd-334911e75af5', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', 'S', 'TEJIDO-CAM-S', null, 'pocas', true),
  ('f0784798-50bb-5045-9208-ecf097c03a16', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', 'M', 'TEJIDO-CAM-M', null, 'disponible', true),
  ('7c2f0c5c-653a-5ffd-a972-ca0fa1f84ba0', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', 'L', 'TEJIDO-CAM-L', null, 'disponible', true),
  ('f641d28a-cecc-53c1-ad55-778428970e0b', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', 'XL', 'TEJIDO-CAM-XL', null, 'disponible', true),
  ('e3f37d88-b231-5dd4-aa71-7428e87112b7', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', 'XXL', 'TEJIDO-CAM-XXL', null, 'disponible', true),
  ('aba082c8-801f-5b5b-b6a7-66d1ea16097d', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', 'S', 'TEJIDO-PER-S', null, 'disponible', true),
  ('2115ed29-1f0f-5901-b9d7-efacef96df9b', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', 'M', 'TEJIDO-PER-M', null, 'disponible', true),
  ('4d663ad8-529b-5f28-8d9a-ba2ab3f12105', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', 'L', 'TEJIDO-PER-L', null, 'disponible', true),
  ('7616824e-b22e-56ac-9b71-50867baf36e3', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', 'XL', 'TEJIDO-PER-XL', null, 'disponible', true),
  ('f72fa2f5-c97e-5104-a409-e7fe89c7b738', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', 'XXL', 'TEJIDO-PER-XXL', null, 'disponible', true),
  ('3e6efacc-1167-54dc-8475-d4a857bc27ab', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', 'S', 'TEJIDO-CAR-S', null, 'agotado', true),
  ('191673da-d8a8-5a60-b21e-01b9a61cb28a', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', 'M', 'TEJIDO-CAR-M', null, 'agotado', true),
  ('d6832b58-5911-5e00-a0e2-51704b291bac', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', 'L', 'TEJIDO-CAR-L', null, 'disponible', true),
  ('27e3163a-4545-5921-a05b-9a78edc4d4f6', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', 'XL', 'TEJIDO-CAR-XL', null, 'disponible', true),
  ('9c55da11-534f-5cbe-9697-c926892e1b82', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', 'XXL', 'TEJIDO-CAR-XXL', 249900, 'disponible', true);

insert into public.product_images (id, product_id, color_id, url, view, sort_order, alt) values
  ('b3b30c2f-616e-51ea-8e9a-37ea39892a27', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', '/seed/camiseta-bruma-hueso-frente.png', 'frente', 0, 'Camiseta Bruma en color Hueso, de frente'),
  ('2bdb54cb-9b6f-5625-ac56-476e85ad12c4', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', '/seed/camiseta-bruma-hueso-espalda.png', 'espalda', 1, 'Camiseta Bruma en color Hueso, por la espalda'),
  ('7720eefa-363a-5ce0-808a-598d8aa5cf4b', '4dda4d29-80fc-589e-8e33-050a61385283', 'b476b54b-bf3e-5300-a949-74d1f37b0382', '/seed/camiseta-bruma-hueso-detalle.png', 'detalle', 2, 'Camiseta Bruma en color Hueso, detalle del cuello'),
  ('21390f7b-afc5-5761-be9f-8d183ff53db1', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', '/seed/camiseta-bruma-arena-frente.png', 'frente', 0, 'Camiseta Bruma en color Arena, de frente'),
  ('dee57782-45a4-5f87-ad50-083ef7170532', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', '/seed/camiseta-bruma-arena-espalda.png', 'espalda', 1, 'Camiseta Bruma en color Arena, por la espalda'),
  ('5076dc7d-c511-5c91-854b-5a231a29b06b', '4dda4d29-80fc-589e-8e33-050a61385283', 'ac8c2764-1ab6-5e7c-99af-07b30575aa03', '/seed/camiseta-bruma-arena-detalle.png', 'detalle', 2, 'Camiseta Bruma en color Arena, detalle del cuello'),
  ('de692101-857c-5a61-b374-7d7c7aa5fac7', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', '/seed/camiseta-sereno-niebla-frente.png', 'frente', 0, 'Camiseta Sereno en color Niebla, de frente'),
  ('f33e3a17-a3ec-5f85-8869-0ee7564d64d4', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', '/seed/camiseta-sereno-niebla-espalda.png', 'espalda', 1, 'Camiseta Sereno en color Niebla, por la espalda'),
  ('aebedc38-ef43-5cc9-aeff-64fd48a01ac8', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', 'ef7890f8-35c5-5b04-9028-908205110b74', '/seed/camiseta-sereno-niebla-detalle.png', 'detalle', 2, 'Camiseta Sereno en color Niebla, detalle del cuello'),
  ('bfa1b086-ad87-5d34-a4ab-f66fb53e3890', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', '/seed/camiseta-sereno-carbon-frente.png', 'frente', 0, 'Camiseta Sereno en color Carbón, de frente'),
  ('486d2c29-ef10-5b3a-b541-578fada3ee4a', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', '/seed/camiseta-sereno-carbon-espalda.png', 'espalda', 1, 'Camiseta Sereno en color Carbón, por la espalda'),
  ('efc06b22-406e-570d-87e7-e4aa32ae3d80', '165f004a-8bd4-5b43-96eb-e7a4cabdabd6', '13a1488c-b5c3-55a3-b5a0-bc7e8135a6ed', '/seed/camiseta-sereno-carbon-detalle.png', 'detalle', 2, 'Camiseta Sereno en color Carbón, detalle del cuello'),
  ('76836fe2-23ac-513c-a399-8a22e68db1d5', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', '/seed/camiseta-senal-terracota-frente.png', 'frente', 0, 'Camiseta Señal en color Terracota, de frente'),
  ('eb07ff2b-15d2-5e3c-831c-a23b77d92f03', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', '/seed/camiseta-senal-terracota-espalda.png', 'espalda', 1, 'Camiseta Señal en color Terracota, por la espalda'),
  ('f3e41087-804f-56a4-ad4c-01398c01a90a', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', 'a70f0edf-2b64-5eac-89af-25dd06f9f319', '/seed/camiseta-senal-terracota-detalle.png', 'detalle', 2, 'Camiseta Señal en color Terracota, detalle del cuello'),
  ('59efd7f8-90be-5306-9ecb-8948051d47fa', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', '/seed/camiseta-senal-hueso-frente.png', 'frente', 0, 'Camiseta Señal en color Hueso, de frente'),
  ('680b5e37-bef9-5291-851d-dbef6be60a74', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', '/seed/camiseta-senal-hueso-espalda.png', 'espalda', 1, 'Camiseta Señal en color Hueso, por la espalda'),
  ('f2ec5ee3-4b7b-500c-b5ec-ef6277666b5c', '07674fe3-ea0c-5f58-b6a3-8990212b91bd', '9ea22b8d-fde0-5329-a809-aa54b78b22ac', '/seed/camiseta-senal-hueso-detalle.png', 'detalle', 2, 'Camiseta Señal en color Hueso, detalle del cuello'),
  ('ca4ab9a7-13de-5fc3-826d-eac005463eff', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', '/seed/sueter-salvia-salvia-frente.png', 'frente', 0, 'Suéter Salvia en color Salvia, de frente'),
  ('1b54ffff-c080-5e01-9f09-fb25942b46f1', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', '/seed/sueter-salvia-salvia-espalda.png', 'espalda', 1, 'Suéter Salvia en color Salvia, por la espalda'),
  ('1726d95e-df74-563e-9c36-f8bdb3d66542', '73e96e79-40f3-59c1-acfa-606161803e53', '13d59aa4-2745-5520-821e-8437d30a473f', '/seed/sueter-salvia-salvia-detalle.png', 'detalle', 2, 'Suéter Salvia en color Salvia, detalle del cuello'),
  ('b5f33fd6-cb10-5bbf-96b9-0e49fc4fa707', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', '/seed/sueter-salvia-crema-frente.png', 'frente', 0, 'Suéter Salvia en color Crema, de frente'),
  ('f3ec5c71-4057-5ab7-b4d2-b9b7de69ed22', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', '/seed/sueter-salvia-crema-espalda.png', 'espalda', 1, 'Suéter Salvia en color Crema, por la espalda'),
  ('0b03c45f-ccc3-5aa9-9d46-2c65b6918399', '73e96e79-40f3-59c1-acfa-606161803e53', 'add56888-318a-5ddc-92b6-7b9e45d3d941', '/seed/sueter-salvia-crema-detalle.png', 'detalle', 2, 'Suéter Salvia en color Crema, detalle del cuello'),
  ('bd322642-8641-5a37-ac30-a2a7e65feed9', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', '/seed/sueter-nocturno-carbon-frente.png', 'frente', 0, 'Suéter Nocturno en color Carbón, de frente'),
  ('6d9a4c36-c31a-58d6-b464-c7659043f040', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', '/seed/sueter-nocturno-carbon-espalda.png', 'espalda', 1, 'Suéter Nocturno en color Carbón, por la espalda'),
  ('622a01c5-4af5-556f-960d-b8c5c49acdc5', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', '789f53c2-2b54-59b9-92c7-47a6653d7a29', '/seed/sueter-nocturno-carbon-detalle.png', 'detalle', 2, 'Suéter Nocturno en color Carbón, detalle del cuello'),
  ('c2221755-3dea-5fcf-889a-1754982c32eb', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', '/seed/sueter-nocturno-vino-frente.png', 'frente', 0, 'Suéter Nocturno en color Vino, de frente'),
  ('762bf55c-0444-5b11-8a29-53be0bc35aa5', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', '/seed/sueter-nocturno-vino-espalda.png', 'espalda', 1, 'Suéter Nocturno en color Vino, por la espalda'),
  ('86ef14d2-dbbc-5441-aadc-f983a21c5351', 'b15c4cfc-7600-5f33-9ce8-c40331f9dd1a', 'ea01f0cf-404a-5a5c-8110-8a50cfc2c0e1', '/seed/sueter-nocturno-vino-detalle.png', 'detalle', 2, 'Suéter Nocturno en color Vino, detalle del cuello'),
  ('df42d581-0c2b-5113-9668-dd9eaeafb478', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', '/seed/cardigan-tejido-camel-frente.png', 'frente', 0, 'Cardigan Tejido en color Camel, de frente'),
  ('6ed55f3a-83cc-5a40-94d2-6b2f97a36f83', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', '/seed/cardigan-tejido-camel-espalda.png', 'espalda', 1, 'Cardigan Tejido en color Camel, por la espalda'),
  ('f6631c67-f953-5fda-b5f1-c20f420ad9d6', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '9fd259e3-a2c9-5fe6-8e94-914b364f6bda', '/seed/cardigan-tejido-camel-detalle.png', 'detalle', 2, 'Cardigan Tejido en color Camel, detalle del cuello'),
  ('d6258263-e7f5-5607-8952-464dd1d925d5', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', '/seed/cardigan-tejido-perla-frente.png', 'frente', 0, 'Cardigan Tejido en color Perla, de frente'),
  ('a9cca757-a789-50e9-b46b-c2ccebd09355', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', '/seed/cardigan-tejido-perla-espalda.png', 'espalda', 1, 'Cardigan Tejido en color Perla, por la espalda'),
  ('ced26fb6-d216-5f21-bf6c-4628f7d6869a', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', '270de2c5-327f-5107-9ce0-b6c60872e6d3', '/seed/cardigan-tejido-perla-detalle.png', 'detalle', 2, 'Cardigan Tejido en color Perla, detalle del cuello'),
  ('16d1488f-5584-503e-bc0f-cfcd4ec7686e', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', '/seed/cardigan-tejido-carbon-frente.png', 'frente', 0, 'Cardigan Tejido en color Carbón, de frente'),
  ('69d519fc-639e-574c-844e-808158b9da1b', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', '/seed/cardigan-tejido-carbon-espalda.png', 'espalda', 1, 'Cardigan Tejido en color Carbón, por la espalda'),
  ('6bd3dbe8-eff3-5f03-85c1-780b750c9542', '87d6ae49-4ad4-55e8-a8d0-2bb9b0afcc9b', 'f3ed48cc-0226-56a0-bc77-586bd5d20791', '/seed/cardigan-tejido-carbon-detalle.png', 'detalle', 2, 'Cardigan Tejido en color Carbón, detalle del cuello');

delete from public.audit_log;

commit;

-- ---------------------------------------------------------------------------
-- ADMINS DE DESARROLLO LOCAL. No se usan en produccion: alli las cuentas se
-- crean con `npm run admin:create`, que exige la service_role key.
-- ---------------------------------------------------------------------------

  -- admin@carmisetas.local  /  contrasena: carmisetas-dev
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', 'ec94d3bc-e5c4-5168-bc2a-a75c7d190dd8', 'authenticated', 'authenticated',
    'admin@carmisetas.local', extensions.crypt('carmisetas-dev', extensions.gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), 'ec94d3bc-e5c4-5168-bc2a-a75c7d190dd8', 'ec94d3bc-e5c4-5168-bc2a-a75c7d190dd8',
    jsonb_build_object('sub', 'ec94d3bc-e5c4-5168-bc2a-a75c7d190dd8', 'email', 'admin@carmisetas.local', 'email_verified', true),
    'email', now(), now(), now()
  ) on conflict do nothing;

  insert into public.admin_profiles (id, full_name)
  values ('ec94d3bc-e5c4-5168-bc2a-a75c7d190dd8', 'Admin Uno') on conflict (id) do nothing;

  -- taller@carmisetas.local  /  contrasena: carmisetas-dev
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous
  ) values (
    '00000000-0000-0000-0000-000000000000', 'a10a96df-2ef6-5636-931c-4e2386a8b8c5', 'authenticated', 'authenticated',
    'taller@carmisetas.local', extensions.crypt('carmisetas-dev', extensions.gen_salt('bf')), now(),
    now(), now(), '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, false, false
  ) on conflict (id) do nothing;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(), 'a10a96df-2ef6-5636-931c-4e2386a8b8c5', 'a10a96df-2ef6-5636-931c-4e2386a8b8c5',
    jsonb_build_object('sub', 'a10a96df-2ef6-5636-931c-4e2386a8b8c5', 'email', 'taller@carmisetas.local', 'email_verified', true),
    'email', now(), now(), now()
  ) on conflict do nothing;

  insert into public.admin_profiles (id, full_name)
  values ('a10a96df-2ef6-5636-931c-4e2386a8b8c5', 'Admin Dos') on conflict (id) do nothing;
