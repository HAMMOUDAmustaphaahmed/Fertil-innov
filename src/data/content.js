// Registre de tous les textes d'interface du site, en trois langues (fr / en / es).
// Front ET backend l'utilisent. Le propriétaire modifie ces textes via le Chef
// (outils list_content / set_content) ; les surcharges vivent dans
// site_settings.textes[cle] = { fr, en, es }. Pas de JSX ici.

const K = (page, label, fr, en, es) => ({ page, label, defaut: { fr, en, es } });

export const CONTENT = {
  // ---------- Navigation ----------
  nav_accueil: K('global', 'Menu — Accueil', 'Accueil', 'Home', 'Inicio'),
  nav_services: K('global', 'Menu — Services', 'Services', 'Services', 'Servicios'),
  nav_activites: K('global', 'Menu — Activités', 'Activités', 'Activities', 'Actividades'),
  nav_expertise: K('global', 'Menu — Expertise', 'Expertise', 'Expertise', 'Experiencia'),
  nav_formations: K('global', 'Menu — Formations', 'Formations', 'Training', 'Formación'),
  nav_chiffres: K('global', 'Menu — Chiffres', 'Chiffres', 'Impact', 'Cifras'),
  nav_blog: K('global', 'Menu — Blog', 'Blog', 'News', 'Blog'),
  nav_faq: K('global', 'Menu — FAQ', 'FAQ', 'FAQ', 'FAQ'),
  nav_contact: K('global', 'Menu — Contact', 'Contact', 'Contact', 'Contacto'),
  nav_bouton: K('global', 'Bouton du menu (haut de page)', 'Demander un devis', 'Request a quote', 'Solicitar presupuesto'),
  nav_langue: K('global', 'Libellé du sélecteur de langue', 'Langue', 'Language', 'Idioma'),

  // ---------- Accueil : hero ----------
  hero_kicker: K('accueil', 'Hero — petite ligne', 'Ingénierie écologique & microbiologie des sols · Grabels, Occitanie', 'Ecological engineering & soil microbiology · Grabels, Occitanie', 'Ingeniería ecológica y microbiología de suelos · Grabels, Occitania'),
  hero_titre: K('accueil', 'Hero — grand titre', 'Redonnons vie aux sols, cultivons l’avenir', 'Bringing soils back to life, growing the future', 'Devolvamos la vida a los suelos, cultivemos el futuro'),
  hero_sous_titre: K('accueil', 'Hero — sous-titre', 'Diagnostic microbiologique, biofertilisation et remédiation écologique : des solutions biologiques mesurables pour les agriculteurs, les industriels et les collectivités.', 'Microbiological diagnosis, biofertilisation and ecological remediation: measurable biological solutions for farmers, industry and local authorities.', 'Diagnóstico microbiológico, biofertilización y remediación ecológica: soluciones biológicas medibles para agricultores, industria y administraciones.'),
  hero_bouton_1: K('accueil', 'Hero — bouton principal', 'Diagnostic microbiologique avancé', 'Advanced microbiological diagnosis', 'Diagnóstico microbiológico avanzado'),
  hero_bouton_2: K('accueil', 'Hero — bouton secondaire', 'Parler à Petit Pois', 'Talk to Petit Pois', 'Hablar con Petit Pois'),
  hero_scroll: K('accueil', 'Hero — indication de défilement', 'Descendre dans le sol', 'Dig into the soil', 'Bajar al suelo'),
  hero_stat_1: K('accueil', 'Hero — chiffre 1', '+40 % de rendement', '+40% yield', '+40 % de rendimiento'),
  hero_stat_2: K('accueil', 'Hero — chiffre 2', '−80 % de polluants en 24 mois', '−80% pollutants in 24 months', '−80 % de contaminantes en 24 meses'),
  hero_stat_3: K('accueil', 'Hero — chiffre 3', '5 000+ souches certifiées', '5,000+ certified strains', '5.000+ cepas certificadas'),

  // ---------- Accueil : horizons (rail de profondeur) ----------
  horizon_surface: K('accueil', 'Rail de profondeur — surface', 'Surface', 'Surface', 'Superficie'),
  horizon_rhizo: K('accueil', 'Rail de profondeur — rhizosphère', 'Rhizosphère', 'Rhizosphere', 'Rizosfera'),
  horizon_a: K('accueil', 'Rail de profondeur — horizon A', 'Horizon A', 'A horizon', 'Horizonte A'),
  horizon_b: K('accueil', 'Rail de profondeur — horizon B', 'Horizon B', 'B horizon', 'Horizonte B'),
  horizon_roche: K('accueil', 'Rail de profondeur — roche mère', 'Roche mère', 'Bedrock', 'Roca madre'),

  // ---------- Accueil : services ----------
  services_kicker: K('accueil', 'Services — petite ligne', 'Nos services spécialisés', 'Our specialised services', 'Nuestros servicios especializados'),
  services_titre: K('accueil', 'Services — titre', 'Des solutions scientifiques, du prélèvement au résultat mesuré', 'Scientific solutions, from sampling to measured results', 'Soluciones científicas, de la muestra al resultado medido'),
  services_texte: K('accueil', 'Services — introduction', 'Des solutions sur mesure pour restaurer la fertilité de vos sols et optimiser vos productions agricoles de manière durable.', 'Tailored solutions to restore the fertility of your soils and optimise your agricultural production sustainably.', 'Soluciones a medida para restaurar la fertilidad de sus suelos y optimizar su producción agrícola de forma sostenible.'),
  services_lien: K('accueil', 'Services — lien', 'Voir tous nos services en détail', 'See all our services in detail', 'Ver todos nuestros servicios en detalle'),
  decouvrir: K('global', 'Bouton « Découvrir »', 'Découvrir', 'Learn more', 'Descubrir'),

  // ---------- Accueil : partenaires ----------
  partenaires_kicker: K('accueil', 'Partenaires — petite ligne', 'Ils nous font confiance', 'They trust us', 'Confían en nosotros'),
  partenaires_titre: K('accueil', 'Partenaires — titre', 'Des collaborations scientifiques et industrielles de premier plan', 'Leading scientific and industrial partnerships', 'Colaboraciones científicas e industriales de primer nivel'),

  // ---------- Accueil : réalisations ----------
  realisations_kicker: K('accueil', 'Réalisations — petite ligne', 'Nos réalisations', 'Our projects', 'Nuestros proyectos'),
  realisations_titre: K('accueil', 'Réalisations — titre', 'Des projets concrets qui redonnent vie aux sols', 'Real projects that bring soils back to life', 'Proyectos concretos que devuelven la vida a los suelos'),
  realisations_texte: K('accueil', 'Réalisations — texte', 'Sites industriels, vignobles, anciennes mines : chaque intervention est suivie par des indicateurs mesurés sur le terrain.', 'Industrial sites, vineyards, former mines: every intervention is tracked with indicators measured in the field.', 'Sitios industriales, viñedos, antiguas minas: cada intervención se sigue con indicadores medidos en campo.'),
  compteur_projets: K('accueil', 'Compteur — projets', 'Projets réalisés', 'Projects completed', 'Proyectos realizados'),
  compteur_ha: K('accueil', 'Compteur — hectares', 'Hectares traités', 'Hectares treated', 'Hectáreas tratadas'),
  compteur_satisfaction: K('accueil', 'Compteur — satisfaction', 'Satisfaction clients', 'Client satisfaction', 'Satisfacción de clientes'),
  compteur_annees: K('accueil', 'Compteur — années', 'Années d’expérience', 'Years of experience', 'Años de experiencia'),

  // ---------- Accueil : pourquoi ----------
  pourquoi_kicker: K('accueil', 'Pourquoi — petite ligne', 'Notre différence', 'What sets us apart', 'Nuestra diferencia'),
  pourquoi_titre: K('accueil', 'Pourquoi — titre', 'Pourquoi choisir Fertil’Innov ?', 'Why choose Fertil’Innov?', '¿Por qué elegir Fertil’Innov?'),
  pourquoi_texte: K('accueil', 'Pourquoi — texte', 'Une approche scientifique rigoureuse, des résultats mesurables et un engagement écologique sans compromis.', 'A rigorous scientific approach, measurable results and an uncompromising ecological commitment.', 'Un enfoque científico riguroso, resultados medibles y un compromiso ecológico sin concesiones.'),
  processus_titre: K('accueil', 'Processus — titre', 'Notre processus en 4 étapes', 'Our 4-step process', 'Nuestro proceso en 4 etapas'),
  processus_texte: K('accueil', 'Processus — texte', 'Du prélèvement au rapport d’impact, chaque étape produit des données que vous gardez.', 'From sampling to impact report, every step produces data you keep.', 'De la toma de muestras al informe de impacto, cada etapa genera datos que usted conserva.'),
  pourquoi_bouton_1: K('accueil', 'Pourquoi — bouton 1', 'Découvrir nos services', 'Discover our services', 'Descubrir nuestros servicios'),
  pourquoi_bouton_2: K('accueil', 'Pourquoi — bouton 2', 'Obtenir un devis gratuit', 'Get a free quote', 'Obtener un presupuesto gratuito'),

  // ---------- Accueil : performance ----------
  perf_kicker: K('accueil', 'Performance — petite ligne', 'Performance & impact', 'Performance & impact', 'Rendimiento e impacto'),
  perf_titre: K('accueil', 'Performance — titre', 'Nos engagements, suivis en chiffres', 'Our commitments, tracked in numbers', 'Nuestros compromisos, seguidos en cifras'),
  perf_objectifs: K('accueil', 'Performance — objectifs', 'Objectifs 2026', '2026 targets', 'Objetivos 2026'),
  perf_projets: K('accueil', 'Performance — projets', 'projets', 'projects', 'proyectos'),
  perf_hectares: K('accueil', 'Performance — hectares', 'ha traités', 'ha treated', 'ha tratadas'),
  perf_carbone: K('accueil', 'Performance — carbone', 'Compensation carbone', 'Carbon offset', 'Compensación de carbono'),
  perf_tonnes: K('accueil', 'Performance — tonnes', 'tonnes de CO₂ séquestrées', 'tonnes of CO₂ sequestered', 'toneladas de CO₂ secuestradas'),
  perf_arbres: K('accueil', 'Performance — arbres', 'arbres préservés (équivalent)', 'trees preserved (equivalent)', 'árboles preservados (equivalente)'),
  perf_formations: K('accueil', 'Performance — formations', 'Formations dispensées', 'Training sessions delivered', 'Formaciones impartidas'),
  perf_partenaires: K('accueil', 'Performance — partenaires', 'Partenaires actifs', 'Active partners', 'Socios activos'),
  perf_plantes: K('accueil', 'Performance — arbres plantés', 'Arbres plantés', 'Trees planted', 'Árboles plantados'),
  perf_progression: K('accueil', 'Performance — progression', 'Progression annuelle des objectifs', 'Annual progress towards targets', 'Progresión anual de los objetivos'),
  perf_annees: K('accueil', 'Performance — années d’expertise', 'ans d’expertise et d’engagement terrain', 'years of expertise and field commitment', 'años de experiencia y compromiso en campo'),

  // ---------- Accueil : équipe ----------
  equipe_kicker: K('accueil', 'Équipe — petite ligne', 'Notre équipe', 'Our team', 'Nuestro equipo'),
  equipe_titre: K('accueil', 'Équipe — titre', 'Des experts passionnés par la microbiologie des sols', 'Experts passionate about soil microbiology', 'Expertos apasionados por la microbiología de suelos'),

  // ---------- Accueil : Petit Pois ----------
  pois_kicker: K('accueil', 'Section Petit Pois — petite ligne', 'Votre assistant', 'Your assistant', 'Su asistente'),
  pois_titre: K('accueil', 'Section Petit Pois — titre', 'Petit Pois répond, qualifie votre besoin et transmet votre demande à l’équipe', 'Petit Pois answers, qualifies your need and passes your request to the team', 'Petit Pois responde, califica su necesidad y transmite su solicitud al equipo'),
  pois_texte: K('accueil', 'Section Petit Pois — texte', 'Décrivez votre parcelle ou votre site : Petit Pois vous oriente vers le bon service, répond aux questions techniques de base et prépare votre demande de devis — l’équipe vous rappelle sous 24 h ouvrées.', 'Describe your plot or site: Petit Pois points you to the right service, answers basic technical questions and prepares your quote request — the team calls you back within 24 working hours.', 'Describa su parcela o su sitio: Petit Pois le orienta hacia el servicio adecuado, responde a preguntas técnicas básicas y prepara su solicitud de presupuesto; el equipo le llama en 24 h laborables.'),
  pois_bouton: K('accueil', 'Section Petit Pois — bouton', 'Discuter avec Petit Pois', 'Chat with Petit Pois', 'Hablar con Petit Pois'),
  pois_bulle: K('accueil', 'Bulle d’invitation de Petit Pois', 'Une question sur vos sols ? 🌱', 'A question about your soils? 🌱', '¿Una pregunta sobre sus suelos? 🌱'),

  // ---------- Services (page) ----------
  services_page_titre: K('services', 'Page Services — titre', 'Nos services', 'Our services', 'Nuestros servicios'),
  services_page_texte: K('services', 'Page Services — introduction', 'Des solutions scientifiques sur mesure pour restaurer la fertilité de vos sols et optimiser vos productions agricoles de manière durable.', 'Tailored scientific solutions to restore your soils’ fertility and sustainably optimise your agricultural production.', 'Soluciones científicas a medida para restaurar la fertilidad de sus suelos y optimizar su producción agrícola de manera sostenible.'),
  services_autres: K('services', 'Page Services — autres services', 'Autres services à découvrir', 'Other services', 'Otros servicios'),

  // ---------- Activités ----------
  activites_titre: K('activites', 'Page Activités — titre', 'Nos activités', 'Our activities', 'Nuestras actividades'),
  activites_texte: K('activites', 'Page Activités — introduction', 'Découvrez nos domaines d’expertise et explorez chaque solution en détail.', 'Discover our fields of expertise and explore each solution in detail.', 'Descubra nuestras áreas de experiencia y explore cada solución en detalle.'),
  activites_sidebar_titre: K('activites', 'Activités — encart : titre', 'Excellence écologique sur mesure', 'Tailor-made ecological excellence', 'Excelencia ecológica a medida'),
  activites_sidebar_1: K('activites', 'Activités — encart : point 1', 'Reconstruction de sols vivants — fertilité durable garantie', 'Rebuilding living soils — lasting fertility guaranteed', 'Reconstrucción de suelos vivos: fertilidad duradera garantizada'),
  activites_sidebar_2: K('activites', 'Activités — encart : point 2', 'Couverts végétaux haute performance — pérennité 5 ans et plus', 'High-performance plant covers — lasting 5 years and more', 'Cubiertas vegetales de alto rendimiento: durabilidad de 5 años o más'),
  activites_sidebar_3: K('activites', 'Activités — encart : point 3', 'Technologies adaptatives — compatibles avec tous les climats', 'Adaptive technologies — compatible with all climates', 'Tecnologías adaptativas: compatibles con todos los climas'),
  activites_sidebar_bouton: K('activites', 'Activités — encart : bouton', 'Audit gratuit', 'Free audit', 'Auditoría gratuita'),
  activites_explorer: K('activites', 'Activités — « explorer »', 'Explorer', 'Explore', 'Explorar'),
  activites_devis: K('activites', 'Activités — bouton du détail', 'Demander un devis personnalisé', 'Request a tailored quote', 'Solicitar un presupuesto personalizado'),

  // ---------- Expertise ----------
  expertise_titre: K('expertise', 'Page Expertise — titre', 'Notre expertise scientifique', 'Our scientific expertise', 'Nuestra experiencia científica'),
  expertise_texte: K('expertise', 'Page Expertise — introduction', 'Des fondamentaux de la microbiologie du sol aux applications concrètes en agriculture régénérative.', 'From the fundamentals of soil microbiology to concrete applications in regenerative agriculture.', 'De los fundamentos de la microbiología del suelo a las aplicaciones concretas en agricultura regenerativa.'),

  // ---------- Formations ----------
  formations_titre: K('formations', 'Page Formations — titre', 'Formations professionnelles', 'Professional training', 'Formación profesional'),
  formations_texte: K('formations', 'Page Formations — introduction', 'Des programmes certifiés pour maîtriser les techniques de microbiologie appliquée.', 'Certified programmes to master applied microbiology techniques.', 'Programas certificados para dominar las técnicas de microbiología aplicada.'),
  formations_formats_titre: K('formations', 'Formations — formats : titre', 'Trois formats, un même niveau d’exigence', 'Three formats, one level of rigour', 'Tres formatos, el mismo nivel de exigencia'),
  formations_presentiel: K('formations', 'Format — présentiel', 'Présentiel', 'In person', 'Presencial'),
  formations_presentiel_texte: K('formations', 'Format — présentiel : texte', 'Sessions en groupe dans nos centres de formation équipés.', 'Group sessions in our fully equipped training centres.', 'Sesiones en grupo en nuestros centros de formación equipados.'),
  formations_enligne: K('formations', 'Format — en ligne', 'En ligne', 'Online', 'En línea'),
  formations_enligne_texte: K('formations', 'Format — en ligne : texte', 'Formations à distance avec accompagnement personnalisé.', 'Remote training with personalised support.', 'Formación a distancia con acompañamiento personalizado.'),
  formations_sursite: K('formations', 'Format — sur site', 'Sur site', 'On site', 'In situ'),
  formations_sursite_texte: K('formations', 'Format — sur site : texte', 'Interventions directement chez vous, sur vos terrains.', 'Delivered at your premises, on your land.', 'Intervenciones directamente en sus instalaciones, en sus terrenos.'),
  formations_bouton: K('formations', 'Formations — bouton', 'Demander le programme', 'Request the programme', 'Solicitar el programa'),
  formations_satisfaction: K('formations', 'Formations — satisfaction', 'de satisfaction', 'satisfaction', 'de satisfacción'),
  jours: K('global', 'Unité — jours', 'jours', 'days', 'días'),
  certifiee: K('global', 'Étiquette — certifiée', 'Certifiée', 'Certified', 'Certificada'),
  personnes: K('global', 'Unité — personnes', 'pers.', 'people', 'pers.'),

  // ---------- Chiffres ----------
  chiffres_titre: K('chiffres', 'Page Chiffres — titre', 'Notre impact en chiffres', 'Our impact in numbers', 'Nuestro impacto en cifras'),
  chiffres_texte: K('chiffres', 'Page Chiffres — introduction', 'Des résultats concrets, mesurés et vérifiables sur le terrain.', 'Concrete results, measured and verifiable in the field.', 'Resultados concretos, medidos y verificables en campo.'),
  chiffres_satisfaction: K('chiffres', 'Chiffre — satisfaction', 'Taux de satisfaction', 'Satisfaction rate', 'Tasa de satisfacción'),
  chiffres_sites: K('chiffres', 'Chiffre — sites', 'Sites traités', 'Sites treated', 'Sitios tratados'),
  chiffres_projets: K('chiffres', 'Chiffre — projets', 'Projets au total', 'Total projects', 'Proyectos en total'),
  chiffres_partenaires: K('chiffres', 'Chiffre — partenaires', 'Partenaires', 'Partners', 'Socios'),
  chiffres_rendement: K('chiffres', 'Indicateur — rendement', 'Rendement agricole', 'Agricultural yield', 'Rendimiento agrícola'),
  chiffres_rendement_note: K('chiffres', 'Indicateur — rendement : note', 'Documenté sur 200+ sites', 'Documented on 200+ sites', 'Documentado en más de 200 sitios'),
  chiffres_eau: K('chiffres', 'Indicateur — eau', 'Eau d’irrigation', 'Irrigation water', 'Agua de riego'),
  chiffres_eau_note: K('chiffres', 'Indicateur — eau : note', 'Mycorhizes : +35 % de rétention', 'Mycorrhizae: +35% retention', 'Micorrizas: +35 % de retención'),
  chiffres_biodiv: K('chiffres', 'Indicateur — biodiversité', 'Biodiversité des sols', 'Soil biodiversity', 'Biodiversidad del suelo'),
  chiffres_biodiv_note: K('chiffres', 'Indicateur — biodiversité : note', 'Indice de Shannon en 18 mois', 'Shannon index over 18 months', 'Índice de Shannon en 18 meses'),
  chiffres_co2: K('chiffres', 'Indicateur — CO₂', 'CO₂ séquestré par ha et par an', 'CO₂ sequestered per ha per year', 'CO₂ secuestrado por ha y año'),
  chiffres_co2_note: K('chiffres', 'Indicateur — CO₂ : note', 'Impact carbone positif', 'Positive carbon impact', 'Impacto de carbono positivo'),
  chiffres_video_titre: K('chiffres', 'Chiffres — bloc final : titre', 'Voir l’impact sur le terrain', 'See the impact in the field', 'Ver el impacto sobre el terreno'),
  chiffres_video_texte: K('chiffres', 'Chiffres — bloc final : texte', 'Comment nos solutions transforment l’agriculture durable et la remédiation des sols, projet après projet.', 'How our solutions transform sustainable agriculture and soil remediation, project after project.', 'Cómo nuestras soluciones transforman la agricultura sostenible y la remediación de suelos, proyecto tras proyecto.'),

  // ---------- Blog ----------
  blog_titre: K('blog', 'Page Blog — titre', 'Blog & actualités', 'Blog & news', 'Blog y noticias'),
  blog_texte: K('blog', 'Page Blog — introduction', 'Nos dernières publications, projets et interventions médiatiques.', 'Our latest publications, projects and media appearances.', 'Nuestras últimas publicaciones, proyectos e intervenciones en medios.'),
  blog_lire: K('blog', 'Blog — lien article', 'Voir la publication', 'View the post', 'Ver la publicación'),
  blog_ecouter: K('blog', 'Blog — lien audio', 'Écouter l’interview', 'Listen to the interview', 'Escuchar la entrevista'),
  blog_min: K('blog', 'Blog — minutes de lecture', 'min de lecture', 'min read', 'min de lectura'),

  // ---------- FAQ ----------
  faq_titre: K('faq', 'Page FAQ — titre', 'Questions scientifiques fréquentes', 'Frequently asked scientific questions', 'Preguntas científicas frecuentes'),
  faq_texte: K('faq', 'Page FAQ — introduction', 'Réponses techniques précises sur nos méthodologies et certifications.', 'Precise technical answers about our methods and certifications.', 'Respuestas técnicas precisas sobre nuestras metodologías y certificaciones.'),
  faq_autre: K('faq', 'FAQ — bloc final : titre', 'Une autre question ?', 'Another question?', '¿Otra pregunta?'),
  faq_autre_texte: K('faq', 'FAQ — bloc final : texte', 'Petit Pois répond immédiatement aux questions courantes ; pour un cas précis, l’équipe vous rappelle sous 24 h.', 'Petit Pois answers common questions instantly; for a specific case, the team calls you back within 24 hours.', 'Petit Pois responde de inmediato a las preguntas habituales; para un caso concreto, el equipo le llama en 24 h.'),

  // ---------- Contact ----------
  contact_titre: K('contact', 'Page Contact — titre', 'Parlons de votre projet', 'Let’s talk about your project', 'Hablemos de su proyecto'),
  contact_texte: K('contact', 'Page Contact — introduction', 'Notre équipe d’experts étudie vos besoins et vous répond sous 24 h ouvrées. Devis gratuit.', 'Our team of experts reviews your needs and replies within 24 working hours. Free quote.', 'Nuestro equipo de expertos estudia sus necesidades y le responde en 24 h laborables. Presupuesto gratuito.'),
  contact_nom: K('contact', 'Formulaire — nom', 'Votre nom', 'Your name', 'Su nombre'),
  contact_email: K('contact', 'Formulaire — email', 'Votre email', 'Your email', 'Su correo electrónico'),
  contact_telephone: K('contact', 'Formulaire — téléphone', 'Téléphone (optionnel)', 'Phone (optional)', 'Teléfono (opcional)'),
  contact_organisation: K('contact', 'Formulaire — organisation', 'Organisation (exploitation, entreprise, collectivité…)', 'Organisation (farm, company, authority…)', 'Organización (explotación, empresa, administración…)'),
  contact_objet: K('contact', 'Formulaire — objet', 'Objet de votre demande', 'Subject of your request', 'Asunto de su solicitud'),
  contact_objet_devis: K('contact', 'Objet — devis', 'Devis pour une prestation', 'Quote for a service', 'Presupuesto para un servicio'),
  contact_objet_formation: K('contact', 'Objet — formation', 'Inscription ou programme de formation', 'Training registration or programme', 'Inscripción o programa de formación'),
  contact_objet_partenariat: K('contact', 'Objet — partenariat', 'Partenariat / R&D', 'Partnership / R&D', 'Colaboración / I+D'),
  contact_objet_info: K('contact', 'Objet — information', 'Question générale', 'General question', 'Pregunta general'),
  contact_service: K('contact', 'Formulaire — service concerné', 'Service concerné', 'Service concerned', 'Servicio en cuestión'),
  contact_surface: K('contact', 'Formulaire — surface', 'Surface concernée (ha, optionnel)', 'Area concerned (ha, optional)', 'Superficie afectada (ha, opcional)'),
  contact_localisation: K('contact', 'Formulaire — localisation', 'Localisation du site (optionnel)', 'Site location (optional)', 'Ubicación del sitio (opcional)'),
  contact_message: K('contact', 'Formulaire — message', 'Décrivez votre sol, votre site ou votre besoin', 'Describe your soil, your site or your need', 'Describa su suelo, su sitio o su necesidad'),
  contact_envoyer: K('contact', 'Formulaire — bouton', 'Envoyer ma demande', 'Send my request', 'Enviar mi solicitud'),
  contact_envoi: K('contact', 'Formulaire — en cours', 'Envoi en cours…', 'Sending…', 'Enviando…'),
  contact_merci_titre: K('contact', 'Formulaire — confirmation : titre', 'Demande bien reçue', 'Request received', 'Solicitud recibida'),
  contact_merci_texte: K('contact', 'Formulaire — confirmation : texte', 'Un accusé de réception vient de vous être envoyé. Un expert vous recontacte sous 24 h ouvrées.', 'An acknowledgement has just been sent to you. An expert will contact you within 24 working hours.', 'Acaba de recibir un acuse de recibo. Un experto le contactará en 24 h laborables.'),
  contact_erreur: K('contact', 'Formulaire — erreur', 'L’envoi a échoué. Réessayez ou appelez-nous directement.', 'Sending failed. Try again or call us directly.', 'El envío ha fallado. Inténtelo de nuevo o llámenos directamente.'),
  contact_tel_titre: K('contact', 'Contact — bloc téléphone', 'Téléphone', 'Phone', 'Teléfono'),
  contact_email_titre: K('contact', 'Contact — bloc email', 'Email', 'Email', 'Correo electrónico'),
  contact_siege_titre: K('contact', 'Contact — bloc siège', 'Siège social', 'Head office', 'Sede social'),
  contact_labo_titre: K('contact', 'Contact — bloc laboratoire', 'Laboratoire', 'Laboratory', 'Laboratorio'),
  contact_horaires_titre: K('contact', 'Contact — bloc horaires', 'Horaires', 'Opening hours', 'Horario'),
  contact_itineraire: K('contact', 'Contact — lien itinéraire', 'Itinéraire', 'Directions', 'Cómo llegar'),
  contact_devis_24h: K('contact', 'Contact — mention devis', 'Devis gratuit sous 24 h', 'Free quote within 24 h', 'Presupuesto gratuito en 24 h'),
  ouvert: K('global', 'Statut — ouvert', 'Ouvert actuellement', 'Open now', 'Abierto ahora'),
  ferme: K('global', 'Statut — fermé', 'Fermé actuellement', 'Closed now', 'Cerrado ahora'),

  // ---------- Pied de page ----------
  footer_description: K('global', 'Pied de page — description', 'Fertil’Innov Environnement est une Jeune Entreprise Innovante spécialisée en ingénierie écologique pour la valorisation durable des microorganismes des sols.', 'Fertil’Innov Environnement is a Young Innovative Company specialised in ecological engineering for the sustainable use of soil microorganisms.', 'Fertil’Innov Environnement es una Joven Empresa Innovadora especializada en ingeniería ecológica para la valorización sostenible de los microorganismos del suelo.'),
  footer_services: K('global', 'Pied de page — colonne services', 'Services', 'Services', 'Servicios'),
  footer_entreprise: K('global', 'Pied de page — colonne entreprise', 'Entreprise', 'Company', 'Empresa'),
  footer_ressources: K('global', 'Pied de page — colonne ressources', 'Ressources', 'Resources', 'Recursos'),
  footer_realisations: K('global', 'Pied de page — lien réalisations', 'Nos réalisations', 'Our projects', 'Nuestros proyectos'),
  footer_rd: K('global', 'Pied de page — lien R&D', 'Recherche & développement', 'Research & development', 'Investigación y desarrollo'),
  footer_droits: K('global', 'Pied de page — droits', 'Tous droits réservés.', 'All rights reserved.', 'Todos los derechos reservados.'),
  footer_certifs: K('global', 'Pied de page — certifications', 'ISO 14001 · ISO 14064-2 · Agriculture Biologique UE · JEI', 'ISO 14001 · ISO 14064-2 · EU Organic Farming · JEI', 'ISO 14001 · ISO 14064-2 · Agricultura Ecológica UE · JEI'),
  footer_haut: K('global', 'Pied de page — retour en haut', 'Retour en haut', 'Back to top', 'Volver arriba'),

  // ---------- Petit Pois (chat) ----------
  pois_nom: K('global', 'Nom de l’assistant', 'Petit Pois', 'Petit Pois', 'Petit Pois'),
  pois_role: K('global', 'Sous-titre de l’assistant', 'Assistant écologique', 'Ecological assistant', 'Asistente ecológico'),
  pois_accueil: K('global', 'Message d’accueil de Petit Pois', 'Bonjour ! 🌱 Je suis Petit Pois, l’assistant de Fertil’Innov. Je peux vous renseigner sur nos services, nos formations et nos méthodes, et préparer votre demande de devis. Comment puis-je vous aider ?', 'Hello! 🌱 I’m Petit Pois, Fertil’Innov’s assistant. I can tell you about our services, training and methods, and prepare your quote request. How can I help?', '¡Hola! 🌱 Soy Petit Pois, el asistente de Fertil’Innov. Puedo informarle sobre nuestros servicios, formaciones y métodos, y preparar su solicitud de presupuesto. ¿En qué puedo ayudarle?'),
  pois_placeholder: K('global', 'Champ de saisie du chat', 'Posez votre question sur vos sols…', 'Ask your question about your soils…', 'Haga su pregunta sobre sus suelos…'),
  pois_ouvrir: K('global', 'Bouton d’ouverture du chat', 'Ouvrir le chat avec Petit Pois', 'Open the chat with Petit Pois', 'Abrir el chat con Petit Pois'),
  pois_quick_1: K('global', 'Question rapide 1', 'Qu’est-ce que le diagnostic microbiologique ?', 'What is microbiological diagnosis?', '¿Qué es el diagnóstico microbiológico?'),
  pois_quick_2: K('global', 'Question rapide 2', 'Comment fonctionne la biofertilisation ?', 'How does biofertilisation work?', '¿Cómo funciona la biofertilización?'),
  pois_quick_3: K('global', 'Question rapide 3', 'Quelles formations proposez-vous ?', 'What training do you offer?', '¿Qué formaciones ofrecen?'),
  pois_quick_4: K('global', 'Question rapide 4', 'Je souhaite un devis gratuit', 'I would like a free quote', 'Quiero un presupuesto gratuito'),
  pois_limite: K('global', 'Message de fin de conversation', 'Nous avons atteint la limite de cette conversation. Pour continuer, appelez-nous ou utilisez le formulaire de contact — l’équipe répond sous 24 h.', 'We have reached the limit of this conversation. To continue, call us or use the contact form — the team replies within 24 hours.', 'Hemos alcanzado el límite de esta conversación. Para continuar, llámenos o utilice el formulario de contacto; el equipo responde en 24 h.'),
  pois_contact_cta: K('global', 'Bouton vers le formulaire dans le chat', 'Ouvrir le formulaire de contact', 'Open the contact form', 'Abrir el formulario de contacto'),
  pois_indispo: K('global', 'Message si Petit Pois est indisponible', 'Petit Pois est indisponible pour le moment. Le formulaire de contact reste ouvert.', 'Petit Pois is unavailable right now. The contact form remains open.', 'Petit Pois no está disponible por el momento. El formulario de contacto sigue abierto.'),
  pois_reste: K('global', 'Compteur de messages restants', 'messages restants', 'messages left', 'mensajes restantes'),

  // ---------- SEO ----------
  seo_accueil: K('global', 'Description Google — accueil', 'Fertil’Innov Environnement, JEI à Grabels (Montpellier) : diagnostic microbiologique des sols, biofertilisation, phytoremédiation et formations. +40 % de rendement, −80 % de polluants en 24 mois.', 'Fertil’Innov Environnement, innovative company near Montpellier: soil microbiological diagnosis, biofertilisation, phytoremediation and training. +40% yield, −80% pollutants in 24 months.', 'Fertil’Innov Environnement, empresa innovadora cerca de Montpellier: diagnóstico microbiológico de suelos, biofertilización, fitorremediación y formación. +40 % de rendimiento, −80 % de contaminantes en 24 meses.'),
  seo_services: K('global', 'Description Google — services', 'Diagnostic microbiologique PCR/NGS, biofertilisation (mycorhizes, PGPR), remédiation écologique, phytomanagement : les services de Fertil’Innov pour agriculteurs et industriels.', 'PCR/NGS microbiological diagnosis, biofertilisation (mycorrhizae, PGPR), ecological remediation, phytomanagement: Fertil’Innov’s services for farmers and industry.', 'Diagnóstico microbiológico PCR/NGS, biofertilización (micorrizas, PGPR), remediación ecológica, fitogestión: los servicios de Fertil’Innov para agricultores e industria.'),
  seo_activites: K('global', 'Description Google — activités', 'Caractérisation des milieux anthropisés, isolement de microorganismes bénéfiques, biofertilisation intelligente, réhabilitation écologique et R&D.', 'Characterisation of anthropised environments, isolation of beneficial microorganisms, smart biofertilisation, ecological rehabilitation and R&D.', 'Caracterización de medios antropizados, aislamiento de microorganismos beneficiosos, biofertilización inteligente, rehabilitación ecológica e I+D.'),
  seo_expertise: K('global', 'Description Google — expertise', 'Microbiome du sol, cycles biogéochimiques, hydromorphologie, biodisponibilité des nutriments : l’expertise scientifique de Fertil’Innov.', 'Soil microbiome, biogeochemical cycles, hydromorphology, nutrient bioavailability: Fertil’Innov’s scientific expertise.', 'Microbioma del suelo, ciclos biogeoquímicos, hidromorfología, biodisponibilidad de nutrientes: la experiencia científica de Fertil’Innov.'),
  seo_formations: K('global', 'Description Google — formations', 'Formations certifiées en analyse microbiologique des sols, biofertilisation, biocontrôle et phytoremédiation — présentiel, en ligne ou sur site. 98 % de satisfaction.', 'Certified training in soil microbiological analysis, biofertilisation, biocontrol and phytoremediation — in person, online or on site. 98% satisfaction.', 'Formación certificada en análisis microbiológico de suelos, biofertilización, biocontrol y fitorremediación: presencial, en línea o in situ. 98 % de satisfacción.'),
  seo_chiffres: K('global', 'Description Google — chiffres', 'Résultats mesurés de Fertil’Innov : 97 % de satisfaction, 200+ sites traités, +40 % de rendement, −70 % d’eau d’irrigation, 4 t de CO₂/ha/an séquestrées.', 'Fertil’Innov’s measured results: 97% satisfaction, 200+ sites treated, +40% yield, −70% irrigation water, 4 t CO₂/ha/year sequestered.', 'Resultados medidos de Fertil’Innov: 97 % de satisfacción, más de 200 sitios tratados, +40 % de rendimiento, −70 % de agua de riego, 4 t de CO₂/ha/año.'),
  seo_blog: K('global', 'Description Google — blog', 'Actualités de Fertil’Innov : projets SONARES et ENDORSE, Pollutec, biostimulants, plantes de montagne et microbiologie des sols.', 'Fertil’Innov news: SONARES and ENDORSE projects, Pollutec, biostimulants, mountain plants and soil microbiology.', 'Noticias de Fertil’Innov: proyectos SONARES y ENDORSE, Pollutec, bioestimulantes, plantas de montaña y microbiología de suelos.'),
  seo_faq: K('global', 'Description Google — FAQ', 'Quels microorganismes ? Quelles normes ISO ? Délais d’un diagnostic ? Les réponses techniques de Fertil’Innov sur les sols, la biofertilisation et la remédiation.', 'Which microorganisms? Which ISO standards? How long does a diagnosis take? Fertil’Innov’s technical answers on soils, biofertilisation and remediation.', '¿Qué microorganismos? ¿Qué normas ISO? ¿Plazos de un diagnóstico? Las respuestas técnicas de Fertil’Innov sobre suelos, biofertilización y remediación.'),
  seo_contact: K('global', 'Description Google — contact', 'Contactez Fertil’Innov Environnement à Grabels (34) : devis gratuit sous 24 h pour un diagnostic de sol, une biofertilisation ou une réhabilitation de site.', 'Contact Fertil’Innov Environnement in Grabels (France): free quote within 24 h for a soil diagnosis, biofertilisation or site rehabilitation.', 'Contacte con Fertil’Innov Environnement en Grabels (Francia): presupuesto gratuito en 24 h para un diagnóstico de suelo, biofertilización o rehabilitación de sitio.'),
};

export const CONTENT_PAGES = ['global', 'accueil', 'services', 'activites', 'expertise', 'formations', 'chiffres', 'blog', 'faq', 'contact'];

/** Texte effectif dans une langue : surcharge du propriétaire, sinon défaut (repli sur le français). */
export function texte(textes, key, lang = 'fr') {
  const o = textes?.[key];
  const v = o && typeof o === 'object' ? o[lang] || o.fr : typeof o === 'string' ? o : undefined;
  if (v) return v;
  const d = CONTENT[key]?.defaut;
  return d ? d[lang] || d.fr : '';
}
