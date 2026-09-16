// Contenu structuré du site (services, activités, formations, FAQ, blog, équipe,
// partenaires, réalisations, chiffres) en trois langues. Front ET backend.
// Le propriétaire modifie ces listes via le Chef (outil manage_list) ; les
// surcharges vivent dans site_settings.listes.<nom>. Pas de JSX ici.

const T = (fr, en, es) => ({ fr, en, es });

// ---------------------------------------------------------------------------
// Services (page Services + cartes de l'accueil). `id` sert d'ancre (#diagnostics).
// ---------------------------------------------------------------------------
export const SERVICES = [
  {
    id: 'diagnostics', icone: 'icon_4.svg', emoji: '🔬',
    titre: T('Diagnostic microbiologique', 'Microbiological diagnosis', 'Diagnóstico microbiológico'),
    resume: T('Analyse PCR/NGS de votre flore microbienne, bilan matière organique, CEC et bioindicateurs de fertilité. Rapport personnalisé en 1 à 2 mois.', 'PCR/NGS analysis of your microbial flora, organic matter balance, CEC and fertility bioindicators. Personalised report within 1–2 months.', 'Análisis PCR/NGS de su flora microbiana, balance de materia orgánica, CIC y bioindicadores de fertilidad. Informe personalizado en 1–2 meses.'),
    intro: T('Nos diagnostics sont fondés sur l’observation de vos sites, leur historique et un dialogue approfondi avec vous. Nous évaluons précisément l’état initial des milieux anthropisés.', 'Our diagnoses are based on observing your sites, their history and an in-depth dialogue with you. We precisely assess the initial state of anthropised environments.', 'Nuestros diagnósticos se basan en la observación de sus sitios, su historial y un diálogo profundo con usted. Evaluamos con precisión el estado inicial de los medios antropizados.'),
    points: [
      { emoji: '🔍', titre: T('Observation détaillée', 'Detailed observation', 'Observación detallada'), texte: T('Caractérisation visuelle et topographique, identification des signes de dégradation (érosion, compactage, pollution).', 'Visual and topographic characterisation, identification of degradation signs (erosion, compaction, pollution).', 'Caracterización visual y topográfica, identificación de signos de degradación (erosión, compactación, contaminación).') },
      { emoji: '🧬', titre: T('Évaluation de la diversité biologique', 'Biological diversity assessment', 'Evaluación de la diversidad biológica'), texte: T('Inventaire des espèces végétales spontanées et identification moléculaire via analyses microbiologiques avancées.', 'Inventory of spontaneous plant species and molecular identification through advanced microbiological analyses.', 'Inventario de especies vegetales espontáneas e identificación molecular mediante análisis microbiológicos avanzados.') },
      { emoji: '🧪', titre: T('Propriétés des sols', 'Soil properties', 'Propiedades del suelo'), texte: T('Analyses biologiques, chimiques et physiques (pH, texture, matière organique, CEC).', 'Biological, chemical and physical analyses (pH, texture, organic matter, CEC).', 'Análisis biológicos, químicos y físicos (pH, textura, materia orgánica, CIC).') },
    ],
    stats: [{ valeur: '1–2', label: T('mois d’analyse', 'months of analysis', 'meses de análisis') }, { valeur: '100 %', label: T('personnalisé', 'tailored', 'personalizado') }],
    cta: T('Demander un diagnostic', 'Request a diagnosis', 'Solicitar un diagnóstico'),
    visible: true,
  },
  {
    id: 'microbiologie', icone: 'icon_5.svg', emoji: '🧫',
    titre: T('Microbiologie appliquée', 'Applied microbiology', 'Microbiología aplicada'),
    resume: T('Biocontrôle des pathogènes racinaires, métagénomique de microbiomes complexes et production de biofertilisants sur mesure.', 'Biocontrol of root pathogens, metagenomics of complex microbiomes and production of tailor-made biofertilisers.', 'Biocontrol de patógenos radiculares, metagenómica de microbiomas complejos y producción de biofertilizantes a medida.'),
    intro: T('Nous développons des solutions de diagnostic des sols fondées sur l’analyse de la flore microbienne pour améliorer la fertilisation des sols.', 'We develop soil diagnosis solutions based on the analysis of microbial flora to improve soil fertilisation.', 'Desarrollamos soluciones de diagnóstico de suelos basadas en el análisis de la flora microbiana para mejorar la fertilización.'),
    points: [
      { emoji: '🔬', titre: T('Analyses microbiologiques', 'Microbiological analyses', 'Análisis microbiológicos'), texte: T('Isolement et sélection de microorganismes bénéfiques, quantification, identification moléculaire par séquençage à haut débit.', 'Isolation and selection of beneficial microorganisms, quantification, molecular identification by high-throughput sequencing.', 'Aislamiento y selección de microorganismos beneficiosos, cuantificación, identificación molecular por secuenciación masiva.') },
      { emoji: '🧴', titre: T('Notre banque de souches', 'Our strain bank', 'Nuestro banco de cepas'), texte: T('5 000+ souches certifiées (partenariat INRAE/CBS) : bactéries fixatrices d’azote, PGPR et champignons mycorhiziens.', '5,000+ certified strains (INRAE/CBS partnership): nitrogen-fixing bacteria, PGPR and mycorrhizal fungi.', 'Más de 5.000 cepas certificadas (colaboración INRAE/CBS): bacterias fijadoras de nitrógeno, PGPR y hongos micorrícicos.') },
      { emoji: '📊', titre: T('Caractérisation avancée', 'Advanced characterisation', 'Caracterización avanzada'), texte: T('Abondance et diversité des communautés microbiennes pour des recommandations précises.', 'Abundance and diversity of microbial communities for precise recommendations.', 'Abundancia y diversidad de las comunidades microbianas para recomendaciones precisas.') },
    ],
    stats: [{ valeur: '5 000+', label: T('souches', 'strains', 'cepas') }, { valeur: '2–5', label: T('mois d’analyse', 'months of analysis', 'meses de análisis') }],
    cta: T('En savoir plus', 'Find out more', 'Saber más'),
    visible: true,
  },
  {
    id: 'biofertilisation', icone: 'icon_1.svg', emoji: '🌱',
    titre: T('Biofertilisation intelligente', 'Smart biofertilisation', 'Biofertilización inteligente'),
    resume: T('Symbioses rhizobium, mycorhizes et PGPR pour +40 % de rendement et −70 % de consommation d’eau. Zéro intrant chimique.', 'Rhizobium symbioses, mycorrhizae and PGPR for +40% yield and −70% water use. Zero chemical inputs.', 'Simbiosis con rhizobium, micorrizas y PGPR para +40 % de rendimiento y −70 % de consumo de agua. Cero insumos químicos.'),
    intro: T('Nous accompagnons les exploitations agricoles dans l’optimisation de la fertilité des sols en favorisant les interactions biologiques naturelles.', 'We support farms in optimising soil fertility by encouraging natural biological interactions.', 'Acompañamos a las explotaciones agrícolas en la optimización de la fertilidad del suelo favoreciendo las interacciones biológicas naturales.'),
    points: [
      { emoji: '💧', titre: T('Fertilisation biologique', 'Biological fertilisation', 'Fertilización biológica'), texte: T('Biostimulation des symbioses racinaires, nutrition minérale optimisée (P, K, Fe) via mycorhizes et PGPR, réduction des engrais chimiques jusqu’à 70 %.', 'Biostimulation of root symbioses, optimised mineral nutrition (P, K, Fe) via mycorrhizae and PGPR, up to 70% less chemical fertiliser.', 'Bioestimulación de simbiosis radiculares, nutrición mineral optimizada (P, K, Fe) mediante micorrizas y PGPR, hasta un 70 % menos de fertilizantes químicos.') },
      { emoji: '🌍', titre: T('Notre engagement Éco+', 'Our Eco+ commitment', 'Nuestro compromiso Eco+'), texte: T('−70 % de besoins en eau, 0 intrant chimique, +40 % de biodiversité en 18 mois.', '−70% water needs, 0 chemical inputs, +40% biodiversity in 18 months.', '−70 % de necesidades de agua, 0 insumos químicos, +40 % de biodiversidad en 18 meses.') },
      { emoji: '📈', titre: T('Résultats mesurables', 'Measurable results', 'Resultados medibles'), texte: T('+40 % de rendement, meilleure absorption des nutriments, sols plus résilients.', '+40% yield, better nutrient uptake, more resilient soils.', '+40 % de rendimiento, mejor absorción de nutrientes, suelos más resilientes.') },
    ],
    stats: [{ valeur: '+40 %', label: T('rendement', 'yield', 'rendimiento') }, { valeur: '−70 %', label: T('eau', 'water', 'agua') }],
    cta: T('Optimiser mes cultures', 'Optimise my crops', 'Optimizar mis cultivos'),
    visible: true,
  },
  {
    id: 'phytomanagement', icone: 'icon_3.svg', emoji: '🌿',
    titre: T('Phytomanagement', 'Phytomanagement', 'Fitogestión'),
    resume: T('Restauration de corridors écologiques, gestion des zones humides, végétalisation de sites dégradés. Technosols fertiles sur mesure.', 'Restoration of ecological corridors, wetland management, revegetation of degraded sites. Tailor-made fertile technosols.', 'Restauración de corredores ecológicos, gestión de humedales, revegetación de sitios degradados. Tecnosuelos fértiles a medida.'),
    intro: T('Nous intervenons sur les sites industriels en activité ou en déprise, ainsi que sur les zones urbaines et périurbaines, pour une réhabilitation écologique.', 'We work on active or disused industrial sites, as well as urban and peri-urban areas, for ecological rehabilitation.', 'Intervenimos en sitios industriales activos o abandonados, así como en zonas urbanas y periurbanas, para una rehabilitación ecológica.'),
    points: [
      { emoji: '🏭', titre: T('Milieux anthropisés', 'Anthropised environments', 'Medios antropizados'), texte: T('Création de technosol fertile, activation de la vie microbienne, phytostabilisation et bioaccumulation des polluants.', 'Creation of fertile technosol, activation of microbial life, phytostabilisation and bioaccumulation of pollutants.', 'Creación de tecnosuelo fértil, activación de la vida microbiana, fitoestabilización y bioacumulación de contaminantes.') },
      { emoji: '🌾', titre: T('Couverts végétaux adaptés', 'Adapted plant covers', 'Cubiertas vegetales adaptadas'), texte: T('Critères de sélection : adaptation au climat, rôle écologique, durabilité des écosystèmes.', 'Selection criteria: climate adaptation, ecological role, ecosystem durability.', 'Criterios de selección: adaptación al clima, papel ecológico, durabilidad de los ecosistemas.') },
      { emoji: '♻️', titre: T('Résultats durables', 'Lasting results', 'Resultados duraderos'), texte: T('−80 % de concentration de polluants en 24 mois, restauration de la biodiversité.', '−80% pollutant concentration in 24 months, biodiversity restored.', '−80 % de concentración de contaminantes en 24 meses, restauración de la biodiversidad.') },
    ],
    stats: [{ valeur: '3–5', label: T('mois de projet', 'months per project', 'meses de proyecto') }, { valeur: '80 %', label: T('de polluants réduits', 'pollutants reduced', 'de contaminantes reducidos') }],
    cta: T('Réhabiliter mon site', 'Rehabilitate my site', 'Rehabilitar mi sitio'),
    visible: true,
  },
  {
    id: 'remediation', icone: 'icon_2.svg', emoji: '♻️',
    titre: T('Remédiation écologique', 'Ecological remediation', 'Remediación ecológica'),
    resume: T('Phytoextraction, phytostabilisation et bioaugmentation pour réduire les polluants de 80 % en 24 mois sur sites industriels et miniers.', 'Phytoextraction, phytostabilisation and bioaugmentation to cut pollutants by 80% in 24 months on industrial and mining sites.', 'Fitoextracción, fitoestabilización y bioaumentación para reducir los contaminantes un 80 % en 24 meses en sitios industriales y mineros.'),
    intro: T('Fertil’Innov Environnement vous accompagne pour réhabiliter vos sites et développer des espaces végétalisés à finalité paysagère ou agricole.', 'Fertil’Innov Environnement helps you rehabilitate your sites and develop green spaces for landscape or agricultural use.', 'Fertil’Innov Environnement le acompaña en la rehabilitación de sus sitios y en el desarrollo de espacios vegetales con fines paisajísticos o agrícolas.'),
    points: [
      { emoji: '🛠️', titre: T('Stratégie de réhabilitation', 'Rehabilitation strategy', 'Estrategia de rehabilitación'), texte: T('Diagnostic complet, plan d’action sur mesure, suivi scientifique rigoureux.', 'Complete diagnosis, tailored action plan, rigorous scientific monitoring.', 'Diagnóstico completo, plan de acción a medida, seguimiento científico riguroso.') },
      { emoji: '🌱', titre: T('Phytoremédiation avancée', 'Advanced phytoremediation', 'Fitorremediación avanzada'), texte: T('Plantes hyperaccumulatrices et microbes pour dégrader ou stabiliser les polluants.', 'Hyperaccumulator plants and microbes to degrade or stabilise pollutants.', 'Plantas hiperacumuladoras y microbios para degradar o estabilizar los contaminantes.') },
      { emoji: '📊', titre: T('Certifications', 'Certifications', 'Certificaciones'), texte: T('Conformité ISO 14001, ISO 14064-2 et Agriculture Biologique UE.', 'ISO 14001, ISO 14064-2 and EU Organic Farming compliance.', 'Conformidad ISO 14001, ISO 14064-2 y Agricultura Ecológica UE.') },
    ],
    stats: [{ valeur: '150+', label: T('sites traités', 'sites treated', 'sitios tratados') }, { valeur: '98 %', label: T('de satisfaction', 'satisfaction', 'de satisfacción') }],
    cta: T('Demander un audit', 'Request an audit', 'Solicitar una auditoría'),
    visible: true,
  },
];

// ---------------------------------------------------------------------------
// Activités (page Activités : cartes + détail)
// ---------------------------------------------------------------------------
export const ACTIVITES = [
  {
    id: 'approche', image: 'labo-analyse',
    titre: T('Notre approche exclusive', 'Our exclusive approach', 'Nuestro enfoque exclusivo'),
    points: [T('Rapidité : 15 jours de l’analyse à l’inoculum', 'Speed: 15 days from analysis to inoculum', 'Rapidez: 15 días del análisis al inóculo'), T('Précision : algorithmes IA plante-microbe', 'Precision: plant–microbe AI algorithms', 'Precisión: algoritmos de IA planta-microbio'), T('Durabilité : 100 % Agriculture Biologique UE', 'Sustainability: 100% EU organic', 'Sostenibilidad: 100 % Agricultura Ecológica UE')],
    sousTitre: T('Méthodologie rigoureuse de diagnostic', 'Rigorous diagnostic methodology', 'Metodología rigurosa de diagnóstico'),
    texte: T('Notre approche repose sur une méthodologie scientifique rigoureuse permettant d’évaluer précisément l’état initial des milieux anthropisés : observation détaillée des sites (topographie, signes de dégradation, historique industriel), évaluation de la diversité biologique par inventaire et identification moléculaire, puis analyse des propriétés biologiques, chimiques et physiques des sols.', 'Our approach relies on a rigorous scientific methodology to precisely assess the initial state of anthropised environments: detailed site observation (topography, degradation signs, industrial history), biological diversity assessment through inventory and molecular identification, then analysis of the soil’s biological, chemical and physical properties.', 'Nuestro enfoque se basa en una metodología científica rigurosa para evaluar con precisión el estado inicial de los medios antropizados: observación detallada de los sitios (topografía, signos de degradación, historial industrial), evaluación de la diversidad biológica mediante inventario e identificación molecular, y análisis de las propiedades biológicas, químicas y físicas de los suelos.'),
    stats: [{ valeur: '1–2', label: T('mois d’analyse', 'months of analysis', 'meses de análisis') }, { valeur: '100 %', label: T('personnalisé', 'tailored', 'personalizado') }],
    visible: true,
  },
  {
    id: 'microorganismes', image: 'microscope',
    titre: T('Chasseurs de microorganismes', 'Microorganism hunters', 'Cazadores de microorganismos'),
    points: [T('Détection ciblée qPCR/NGS', 'Targeted qPCR/NGS detection', 'Detección dirigida qPCR/NGS'), T('Banque de 5 000+ souches certifiées', 'Bank of 5,000+ certified strains', 'Banco de más de 5.000 cepas certificadas'), T('Sélection anti-stress climatique', 'Climate-stress selection', 'Selección frente al estrés climático')],
    sousTitre: T('Intelligence microbienne avancée', 'Advanced microbial intelligence', 'Inteligencia microbiana avanzada'),
    texte: T('Isolement et sélection de microorganismes bénéfiques (champignons, bactéries symbiotiques), quantification, identification moléculaire par séquençage à haut débit et caractérisation de l’abondance et de la diversité des communautés. Notre banque de souches (partenariat INRAE/CBS) réunit bactéries fixatrices d’azote (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens) et champignons mycorhiziens (Funneliformis mosseae, Rhizophagus irregularis).', 'Isolation and selection of beneficial microorganisms (fungi, symbiotic bacteria), quantification, molecular identification by high-throughput sequencing and characterisation of community abundance and diversity. Our strain bank (INRAE/CBS partnership) brings together nitrogen-fixing bacteria (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens) and mycorrhizal fungi (Funneliformis mosseae, Rhizophagus irregularis).', 'Aislamiento y selección de microorganismos beneficiosos (hongos, bacterias simbióticas), cuantificación, identificación molecular por secuenciación masiva y caracterización de la abundancia y diversidad de las comunidades. Nuestro banco de cepas (colaboración INRAE/CBS) reúne bacterias fijadoras de nitrógeno (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens) y hongos micorrícicos (Funneliformis mosseae, Rhizophagus irregularis).'),
    stats: [{ valeur: '5 000+', label: T('souches', 'strains', 'cepas') }, { valeur: '2–5', label: T('mois d’analyse', 'months of analysis', 'meses de análisis') }],
    visible: true,
  },
  {
    id: 'biofertilisation', image: 'racines',
    titre: T('Biofertilisation intelligente', 'Smart biofertilisation', 'Biofertilización inteligente'),
    points: [T('Symbiose 2.0 : boost racinaire +40 % N', 'Symbiosis 2.0: root boost +40% N', 'Simbiosis 2.0: impulso radicular +40 % N'), T('Mycorhizes : associations P-K-Fe optimisées', 'Mycorrhizae: optimised P-K-Fe associations', 'Micorrizas: asociaciones P-K-Fe optimizadas'), T('Kit d’autodiagnostic : profil en 72 h', 'Self-diagnosis kit: profile in 72 h', 'Kit de autodiagnóstico: perfil en 72 h')],
    sousTitre: T('Agriculture régénérative innovante', 'Innovative regenerative agriculture', 'Agricultura regenerativa innovadora'),
    texte: T('Biostimulation des symbioses racinaires pour améliorer la nutrition azotée, nutrition minérale optimisée (P, K, Fe) via champignons mycorhiziens et PGPR, meilleure absorption des nutriments et réduction de 70 % des engrais chimiques. Engagement Éco+ : −70 % de besoins en eau grâce aux mycorhizes, 0 intrant chimique, +40 % de biodiversité en 18 mois.', 'Biostimulation of root symbioses to improve nitrogen nutrition, optimised mineral nutrition (P, K, Fe) through mycorrhizal fungi and PGPR, better nutrient uptake and 70% less chemical fertiliser. Eco+ commitment: −70% water needs thanks to mycorrhizae, 0 chemical inputs, +40% biodiversity in 18 months.', 'Bioestimulación de las simbiosis radiculares para mejorar la nutrición nitrogenada, nutrición mineral optimizada (P, K, Fe) mediante hongos micorrícicos y PGPR, mejor absorción de nutrientes y reducción del 70 % de los fertilizantes químicos. Compromiso Eco+: −70 % de necesidades de agua gracias a las micorrizas, 0 insumos químicos, +40 % de biodiversidad en 18 meses.'),
    stats: [{ valeur: '+40 %', label: T('rendement', 'yield', 'rendimiento') }, { valeur: '−70 %', label: T('eau', 'water', 'agua') }],
    visible: true,
  },
  {
    id: 'rehabilitation', image: 'site-rehabilite',
    titre: T('Réhabilitation écologique', 'Ecological rehabilitation', 'Rehabilitación ecológica'),
    points: [T('Sites miniers & industriels', 'Mining & industrial sites', 'Sitios mineros e industriales'), T('Carrières & sols pollués', 'Quarries & polluted soils', 'Canteras y suelos contaminados'), T('Zones urbaines dégradées', 'Degraded urban areas', 'Zonas urbanas degradadas')],
    sousTitre: T('Intervention en milieux anthropisés', 'Working in anthropised environments', 'Intervención en medios antropizados'),
    texte: T('Nous intervenons sur les sites industriels en activité ou en déprise et sur les zones urbaines et périurbaines : création de technosol fertile avec amendements adaptés, activation de la vie microbienne par inoculation, phytostabilisation (plantes + microbes immobilisent les polluants) et bioaccumulation (−80 % de concentration en 24 mois). Les couverts végétaux sont choisis selon l’adaptation au climat, le rôle écologique et la durabilité des écosystèmes.', 'We work on active or disused industrial sites and on urban and peri-urban areas: creation of fertile technosol with suitable amendments, activation of microbial life by inoculation, phytostabilisation (plants + microbes immobilise pollutants) and bioaccumulation (−80% concentration in 24 months). Plant covers are chosen for climate adaptation, ecological role and ecosystem durability.', 'Intervenimos en sitios industriales activos o abandonados y en zonas urbanas y periurbanas: creación de tecnosuelo fértil con enmiendas adecuadas, activación de la vida microbiana por inoculación, fitoestabilización (plantas + microbios inmovilizan los contaminantes) y bioacumulación (−80 % de concentración en 24 meses). Las cubiertas vegetales se eligen según la adaptación al clima, el papel ecológico y la durabilidad de los ecosistemas.'),
    stats: [{ valeur: '3–5', label: T('mois de projet', 'months per project', 'meses de proyecto') }, { valeur: '80 %', label: T('de polluants réduits', 'pollutants reduced', 'de contaminantes reducidos') }],
    visible: true,
  },
  {
    id: 'innovation', image: 'labo-recherche',
    titre: T('Innovation continue', 'Continuous innovation', 'Innovación continua'),
    points: [T('R&D permanente', 'Ongoing R&D', 'I+D permanente'), T('Certifications internationales', 'International certifications', 'Certificaciones internacionales'), T('Support technique 24/7', '24/7 technical support', 'Soporte técnico 24/7')],
    sousTitre: T('Recherche & développement permanent', 'Ongoing research & development', 'Investigación y desarrollo permanente'),
    texte: T('Fertil’Innov investit continuellement dans la recherche : équipe pluridisciplinaire (microbiologistes, agronomes, écologues), équipement avancé (microscopie, séquençage ADN, cultures cellulaires), serres expérimentales pour des tests en conditions contrôlées. Certifications ISO 14001 (gestion environnementale), ISO 14064-2 (quantification GES) et Agriculture Biologique UE.', 'Fertil’Innov invests continuously in research: a multidisciplinary team (microbiologists, agronomists, ecologists), advanced equipment (microscopy, DNA sequencing, cell cultures), experimental greenhouses for tests under controlled conditions. ISO 14001 (environmental management), ISO 14064-2 (GHG quantification) and EU Organic Farming certifications.', 'Fertil’Innov invierte continuamente en investigación: equipo multidisciplinar (microbiólogos, agrónomos, ecólogos), equipamiento avanzado (microscopía, secuenciación de ADN, cultivos celulares), invernaderos experimentales para ensayos en condiciones controladas. Certificaciones ISO 14001 (gestión ambiental), ISO 14064-2 (cuantificación de GEI) y Agricultura Ecológica UE.'),
    stats: [{ valeur: '100 %', label: T('certifié', 'certified', 'certificado') }, { valeur: '24/7', label: T('support', 'support', 'soporte') }],
    visible: true,
  },
];

// ---------------------------------------------------------------------------
// Expertise scientifique (page Expertise)
// ---------------------------------------------------------------------------
export const EXPERTISE = [
  { id: 'microbiome', emoji: '🧬', titre: T('Microbiome du sol', 'Soil microbiome', 'Microbioma del suelo'),
    texte: T('Un gramme de sol contient 10⁹ microorganismes. Notre approche cible les bactéries bénéfiques (Rhizobium, Bacillus) et les champignons mycorhiziens qui augmentent la biodisponibilité des nutriments de 30 à 40 %.', 'One gram of soil holds 10⁹ microorganisms. Our approach targets beneficial bacteria (Rhizobium, Bacillus) and mycorrhizal fungi that raise nutrient bioavailability by 30–40%.', 'Un gramo de suelo contiene 10⁹ microorganismos. Nuestro enfoque se centra en las bacterias beneficiosas (Rhizobium, Bacillus) y los hongos micorrícicos, que aumentan la biodisponibilidad de nutrientes un 30–40 %.'),
    impact: T('+300 % d’absorption azotée via Rhizobium leguminosarum.', '+300% nitrogen uptake via Rhizobium leguminosarum.', '+300 % de absorción de nitrógeno mediante Rhizobium leguminosarum.'), visible: true },
  { id: 'cycles', emoji: '🌍', titre: T('Cycles biogéochimiques', 'Biogeochemical cycles', 'Ciclos biogeoquímicos'),
    texte: T('Carbone : nos interventions augmentent le stock de carbone organique de 0,5 à 1 % par an, soit 5 à 10 tonnes de CO₂ eq/ha/an fixées. Azote : réduction de 60 % des nitrates lixiviés par optimisation des processus de nitrification et dénitrification.', 'Carbon: our interventions raise organic carbon stocks by 0.5–1% per year, i.e. 5–10 tonnes of CO₂ eq/ha/year fixed. Nitrogen: 60% less leached nitrate through optimised nitrification and denitrification.', 'Carbono: nuestras intervenciones aumentan el stock de carbono orgánico un 0,5–1 % al año, es decir, 5–10 toneladas de CO₂ eq/ha/año fijadas. Nitrógeno: reducción del 60 % de los nitratos lixiviados mediante la optimización de la nitrificación y desnitrificación.'),
    impact: T('5 à 10 t CO₂ eq/ha/an fixées.', '5–10 t CO₂ eq/ha/year fixed.', '5–10 t CO₂ eq/ha/año fijadas.'), visible: true },
  { id: 'hydro', emoji: '💧', titre: T('Hydromorphologie', 'Hydromorphology', 'Hidromorfología'),
    texte: T('Capacité de rétention : +25 à 35 % après inoculation microbienne grâce aux exopolysaccharides qui produisent une structure macro-agrégée stable. Besoins en eau : −70 % par rapport à l’agriculture conventionnelle grâce aux mycorhizes, qui augmentent la profondeur d’exploration racinaire.', 'Water retention: +25–35% after microbial inoculation thanks to exopolysaccharides that build a stable macro-aggregated structure. Water needs: −70% versus conventional agriculture thanks to mycorrhizae, which deepen root exploration.', 'Capacidad de retención: +25–35 % tras la inoculación microbiana gracias a los exopolisacáridos que generan una estructura macroagregada estable. Necesidades de agua: −70 % respecto a la agricultura convencional gracias a las micorrizas, que aumentan la profundidad de exploración radicular.'),
    impact: T('−70 % de besoins en eau.', '−70% water needs.', '−70 % de necesidades de agua.'), visible: true },
  { id: 'nutriments', emoji: '🔬', titre: T('Biodisponibilité des nutriments', 'Nutrient bioavailability', 'Biodisponibilidad de nutrientes'),
    texte: T('Phosphore : solubilisation microbienne (PSB), +150 à 200 % de P assimilable. Potassium : mobilisation par Bacillus megaterium, +80 % de K disponible. Fer : chélation du Fe³⁺ en Fe²⁺ biodisponible.', 'Phosphorus: microbial solubilisation (PSB), +150–200% available P. Potassium: mobilisation by Bacillus megaterium, +80% available K. Iron: chelation of Fe³⁺ into bioavailable Fe²⁺.', 'Fósforo: solubilización microbiana (PSB), +150–200 % de P asimilable. Potasio: movilización por Bacillus megaterium, +80 % de K disponible. Hierro: quelación del Fe³⁺ en Fe²⁺ biodisponible.'),
    impact: T('+150 à 200 % de phosphore assimilable.', '+150–200% available phosphorus.', '+150–200 % de fósforo asimilable.'), visible: true },
];

// ---------------------------------------------------------------------------
// Formations
// ---------------------------------------------------------------------------
export const FORMATIONS = [
  { id: 'analyse', emoji: '🔬', titre: T('Analyse microbiologique des sols', 'Soil microbiological analysis', 'Análisis microbiológico de suelos'),
    accroche: T('Maîtrisez les techniques avancées d’analyse', 'Master advanced analysis techniques', 'Domine las técnicas avanzadas de análisis'),
    texte: T('Formation complète sur les méthodes d’analyse et d’interprétation des données microbiologiques des sols pour optimiser la fertilité.', 'Comprehensive training in methods for analysing and interpreting soil microbiological data to optimise fertility.', 'Formación completa sobre los métodos de análisis e interpretación de datos microbiológicos del suelo para optimizar la fertilidad.'),
    duree: 2, tags: [T('Certifiée', 'Certified', 'Certificada'), T('8–12 pers.', '8–12 people', '8–12 pers.')], visible: true },
  { id: 'biofertilisation', emoji: '🌱', titre: T('Biofertilisation et biocontrôle', 'Biofertilisation and biocontrol', 'Biofertilización y biocontrol'),
    accroche: T('Solutions innovantes pour vos cultures', 'Innovative solutions for your crops', 'Soluciones innovadoras para sus cultivos'),
    texte: T('Apprenez à mettre en œuvre des solutions de biofertilisation et de biocontrôle dans vos systèmes de culture.', 'Learn to implement biofertilisation and biocontrol solutions in your cropping systems.', 'Aprenda a implementar soluciones de biofertilización y biocontrol en sus sistemas de cultivo.'),
    duree: 3, tags: [T('Certifiée', 'Certified', 'Certificada'), T('TP inclus', 'Practicals included', 'Prácticas incluidas')], visible: true },
  { id: 'phytoremediation', emoji: '♻️', titre: T('Phytoremédiation des sites pollués', 'Phytoremediation of polluted sites', 'Fitorremediación de sitios contaminados'),
    accroche: T('Techniques de dépollution par les plantes', 'Plant-based decontamination techniques', 'Técnicas de descontaminación con plantas'),
    texte: T('Techniques de dépollution des sols par les plantes : théorie, cas pratiques et études de terrain.', 'Plant-based soil decontamination techniques: theory, case studies and field work.', 'Técnicas de descontaminación de suelos con plantas: teoría, casos prácticos y estudios de campo.'),
    duree: 2, tags: [T('Terrain', 'Field work', 'Campo'), T('Certifiée', 'Certified', 'Certificada')], visible: true },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------
export const FAQ = [
  { id: 'microorganismes', emoji: '🦠', question: T('Quels microorganismes utilisez-vous exactement ?', 'Which microorganisms exactly do you use?', '¿Qué microorganismos utilizan exactamente?'),
    reponse: T('Nous sélectionnons parmi 5 000+ souches certifiées issues de notre banque interne (partenariat INRAE/CBS) : bactéries fixatrices d’azote (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens), champignons mycorhiziens (Funneliformis mosseae, Rhizophagus irregularis) et agents de biocontrôle (Trichoderma harzianum, Streptomyces spp.). La sélection repose sur un appariement IA plante-microbe-climat et des tests de stress (sécheresse, chaleur, salinité).', 'We select from 5,000+ certified strains in our in-house bank (INRAE/CBS partnership): nitrogen-fixing bacteria (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens), mycorrhizal fungi (Funneliformis mosseae, Rhizophagus irregularis) and biocontrol agents (Trichoderma harzianum, Streptomyces spp.). Selection relies on AI plant–microbe–climate matching and stress tests (drought, heat, salinity).', 'Seleccionamos entre más de 5.000 cepas certificadas de nuestro banco interno (colaboración INRAE/CBS): bacterias fijadoras de nitrógeno (Rhizobium leguminosarum, Frankia alni), PGPR (Bacillus subtilis, Pseudomonas fluorescens), hongos micorrícicos (Funneliformis mosseae, Rhizophagus irregularis) y agentes de biocontrol (Trichoderma harzianum, Streptomyces spp.). La selección se basa en un emparejamiento por IA planta-microbio-clima y en pruebas de estrés (sequía, calor, salinidad).'), visible: true },
  { id: 'normes', emoji: '📋', question: T('Quelles normes et certifications appliquez-vous ?', 'Which standards and certifications do you apply?', '¿Qué normas y certificaciones aplican?'),
    reponse: T('ISO 14001 (gestion environnementale), ISO 14064-2 (quantification et rapportage des GES), ISO 23611-2 (biologie du sol — méthodes de laboratoire), NF U 42-001 (agents de biocontrôle), Agriculture Biologique (CE n° 834/2007) et règlement (UE) n° 1107/2009 sur les produits phytopharmaceutiques.', 'ISO 14001 (environmental management), ISO 14064-2 (GHG quantification and reporting), ISO 23611-2 (soil biology — laboratory methods), NF U 42-001 (biocontrol agents), Organic Farming (EC No 834/2007) and Regulation (EU) No 1107/2009 on plant protection products.', 'ISO 14001 (gestión ambiental), ISO 14064-2 (cuantificación e informe de GEI), ISO 23611-2 (biología del suelo — métodos de laboratorio), NF U 42-001 (agentes de biocontrol), Agricultura Ecológica (CE n.º 834/2007) y Reglamento (UE) n.º 1107/2009 sobre productos fitosanitarios.'), visible: true },
  { id: 'pollution', emoji: '♻️', question: T('Peut-on appliquer vos solutions sur des terres polluées ?', 'Can your solutions be applied to polluted land?', '¿Se pueden aplicar sus soluciones en tierras contaminadas?'),
    reponse: T('Oui, via deux stratégies complémentaires : la phytostabilisation (plantes et microbes immobilisent métaux lourds et hydrocarbures) et la bioaccumulation (champignons et bactéries séquestrent les polluants, −80 % de concentration en 24 mois). Pré-requis : analyse préalable avec tests de toxicité, conformément à la norme ISO 17402.', 'Yes, through two complementary strategies: phytostabilisation (plants and microbes immobilise heavy metals and hydrocarbons) and bioaccumulation (fungi and bacteria sequester pollutants, −80% concentration in 24 months). Prerequisite: prior analysis with toxicity tests, in line with ISO 17402.', 'Sí, mediante dos estrategias complementarias: la fitoestabilización (plantas y microbios inmovilizan metales pesados e hidrocarburos) y la bioacumulación (hongos y bacterias secuestran los contaminantes, −80 % de concentración en 24 meses). Requisito previo: análisis con pruebas de toxicidad, conforme a la norma ISO 17402.'), visible: true },
  { id: 'kpi', emoji: '📊', question: T('Comment mesurez-vous le succès d’une intervention ?', 'How do you measure the success of an intervention?', '¿Cómo miden el éxito de una intervención?'),
    reponse: T('Nous suivons 8 indicateurs clés : microbiome (qPCR/NGS avant-après), fertilité (matière organique +3 à 5 %/an, CEC, pH, NPK biodisponible), hydrique (rétention, infiltrabilité), rendement (+35 à 40 %), biodiversité (indice de Shannon, nématodes, arthropodes), carbone (tCO₂/ha/an, durabilité 15 ans et plus), ROI (−70 % d’intrants) et certification (audit ISO, rapports ODD).', 'We track 8 key indicators: microbiome (qPCR/NGS before–after), fertility (organic matter +3–5%/year, CEC, pH, bioavailable NPK), water (retention, infiltrability), yield (+35–40%), biodiversity (Shannon index, nematodes, arthropods), carbon (tCO₂/ha/year, 15+ years durability), ROI (−70% inputs) and certification (ISO audit, SDG reports).', 'Seguimos 8 indicadores clave: microbioma (qPCR/NGS antes-después), fertilidad (materia orgánica +3–5 %/año, CIC, pH, NPK biodisponible), agua (retención, infiltrabilidad), rendimiento (+35–40 %), biodiversidad (índice de Shannon, nematodos, artrópodos), carbono (tCO₂/ha/año, durabilidad de más de 15 años), ROI (−70 % de insumos) y certificación (auditoría ISO, informes ODS).'), visible: true },
  { id: 'delais', emoji: '⏱️', question: T('Combien de temps prend un diagnostic de sol ?', 'How long does a soil diagnosis take?', '¿Cuánto tiempo lleva un diagnóstico de suelo?'),
    reponse: T('Un diagnostic microbiologique complet prend 1 à 2 mois selon la complexité du site : semaines 1–2 prélèvements terrain et envoi au laboratoire, semaines 3–5 analyses PCR/NGS et mesures physico-chimiques, semaines 6–8 rédaction du rapport personnalisé avec plan d’action et feuille de route.', 'A complete microbiological diagnosis takes 1–2 months depending on site complexity: weeks 1–2 field sampling and shipping to the lab, weeks 3–5 PCR/NGS analyses and physico-chemical measurements, weeks 6–8 writing the personalised report with action plan and roadmap.', 'Un diagnóstico microbiológico completo lleva de 1 a 2 meses según la complejidad del sitio: semanas 1–2 toma de muestras y envío al laboratorio, semanas 3–5 análisis PCR/NGS y mediciones fisicoquímicas, semanas 6–8 redacción del informe personalizado con plan de acción y hoja de ruta.'), visible: true },
  { id: 'devis', emoji: '💰', question: T('Comment obtenir un devis ?', 'How do I get a quote?', '¿Cómo obtener un presupuesto?'),
    reponse: T('Devis gratuit sous 24 h par téléphone (+33 4 99 62 98 71, lundi–vendredi 8 h–18 h), mobile (+33 6 38 74 76 69), email (s.soussou@fertilinnov-environnement.com), via le formulaire de contact ou directement avec Petit Pois. Précisez la localisation, la superficie concernée et le type de problème rencontré pour un devis plus précis.', 'Free quote within 24 h by phone (+33 4 99 62 98 71, Monday–Friday 8am–6pm), mobile (+33 6 38 74 76 69), email (s.soussou@fertilinnov-environnement.com), via the contact form or directly with Petit Pois. Give the location, area concerned and type of problem for a more accurate quote.', 'Presupuesto gratuito en 24 h por teléfono (+33 4 99 62 98 71, lunes a viernes de 8 a 18 h), móvil (+33 6 38 74 76 69), correo (s.soussou@fertilinnov-environnement.com), mediante el formulario de contacto o directamente con Petit Pois. Indique la ubicación, la superficie y el tipo de problema para un presupuesto más preciso.'), visible: true },
];

// ---------------------------------------------------------------------------
// Blog / actualités
// ---------------------------------------------------------------------------
export const BLOG = [
  { id: 'interview', image: '', categorie: T('Interview', 'Interview', 'Entrevista'), date: '2023-03-24', duree: 0, audio: true,
    titre: T('Notre CEO partage son expertise sur la microbiologie des sols', 'Our CEO shares her expertise on soil microbiology', 'Nuestra CEO comparte su experiencia en microbiología de suelos'),
    texte: T('Interview exclusive sur SansTransition où Souhir Soussou explique l’importance de l’innovation microbienne.', 'Exclusive interview on SansTransition where Souhir Soussou explains the importance of microbial innovation.', 'Entrevista exclusiva en SansTransition donde Souhir Soussou explica la importancia de la innovación microbiana.'),
    lien: 'https://hearthis.at/sanstransition-7h/sans-transition-vendredi-24-mars/', visible: true },
  { id: 'pollutec', image: 'blog-pollutec', categorie: T('Innovation', 'Innovation', 'Innovación'), date: '2024-12-05', duree: 4,
    titre: T('Clôture inspirante de Pollutec 2025', 'An inspiring close to Pollutec 2025', 'Cierre inspirador de Pollutec 2025'),
    texte: T('Retour sur notre participation avec CRISALID et le pôle AXELERA autour des enjeux de réhabilitation des sols.', 'A look back at our participation with CRISALID and the AXELERA cluster on soil rehabilitation challenges.', 'Balance de nuestra participación con CRISALID y el polo AXELERA en torno a los retos de la rehabilitación de suelos.'),
    lien: 'https://fr.linkedin.com/posts/fertil-innov-environnement_pollutec2025-environnement-crisalid-activity-7383133899066941440-Jw9J', visible: true },
  { id: 'carnoules', image: 'blog-carnoules', categorie: T('Recherche', 'Research', 'Investigación'), date: '2024-11-15', duree: 3,
    titre: T('Projet SONARES : essais sur l’ancienne mine de Carnoulès', 'SONARES project: trials at the former Carnoulès mine', 'Proyecto SONARES: ensayos en la antigua mina de Carnoulès'),
    texte: T('Une journée d’essais ensoleillée avec notre équipe et nos partenaires pour le projet de réhabilitation.', 'A sunny day of trials with our team and partners for the rehabilitation project.', 'Una jornada soleada de ensayos con nuestro equipo y nuestros socios para el proyecto de rehabilitación.'),
    lien: 'https://fr.linkedin.com/posts/fertil-innov-environnement_sonares-hortsys-companyandcampus-activity-7392590170132344832-CQgM', visible: true },
  { id: 'arnica', image: 'blog-arnica', categorie: T('Agriculture', 'Agriculture', 'Agricultura'), date: '2024-10-10', duree: 5,
    titre: T('Valoriser les plantes de montagne grâce aux microorganismes', 'Adding value to mountain plants with microorganisms', 'Valorizar las plantas de montaña gracias a los microorganismos'),
    texte: T('Accompagnement d’ALTIFLORE dans la culture d’arnica et d’argousier : la symbiose racinaire au cœur de notre expertise.', 'Supporting ALTIFLORE in growing arnica and sea buckthorn: root symbiosis at the heart of our expertise.', 'Acompañamiento a ALTIFLORE en el cultivo de árnica y espino amarillo: la simbiosis radicular en el centro de nuestra experiencia.'),
    lien: 'https://fr.linkedin.com/posts/fertil-innov-environnement_microbiologie-symbiose-agro%C3%A9cologie-activity-7325133574653841409-zjD8', visible: true },
  { id: 'endorse', image: 'blog-endorse', categorie: T('Innovation', 'Innovation', 'Innovación'), date: '2024-09-08', duree: 4,
    titre: T('Projet européen ENDORSE : récupération du phosphore', 'European ENDORSE project: phosphorus recovery', 'Proyecto europeo ENDORSE: recuperación del fósforo'),
    texte: T('Kick-off du projet Interreg Sudoe pour développer des fertilisants durables à partir de déchets organiques.', 'Kick-off of the Interreg Sudoe project to develop sustainable fertilisers from organic waste.', 'Arranque del proyecto Interreg Sudoe para desarrollar fertilizantes sostenibles a partir de residuos orgánicos.'),
    lien: 'https://www.linkedin.com/posts/fertil-innov-environnement_endorse-endorse-interregsudoe-activity-7354516908672442368-MjTH', visible: true },
  { id: 'biostimulants', image: 'blog-biostimulants', categorie: T('Recherche', 'Research', 'Investigación'), date: '2024-09-01', duree: 6,
    titre: T('Contrôle microbiologique des biostimulants', 'Microbiological control of biostimulants', 'Control microbiológico de los bioestimulantes'),
    texte: T('L’importance de quantifier et suivre les microorganismes vivants pour garantir leur performance agronomique.', 'Why quantifying and tracking living microorganisms matters to guarantee their agronomic performance.', 'La importancia de cuantificar y seguir los microorganismos vivos para garantizar su rendimiento agronómico.'),
    lien: 'https://fr.linkedin.com/posts/fertil-innov-environnement_biostimulants-biocontr%C3%B4le-microbiologie-activity-7354503814902652929-Ay0M', visible: true },
];

// ---------------------------------------------------------------------------
// Équipe
// ---------------------------------------------------------------------------
export const EQUIPE = [
  { id: 'souhir', image: 'equipe-souhir', nom: 'Dr Souhir Soussou', role: T('Fondatrice et directrice', 'Founder and director', 'Fundadora y directora'), texte: T('Expertise en microbiologie et remédiation des sols. Direction stratégique et innovation.', 'Expertise in microbiology and soil remediation. Strategic leadership and innovation.', 'Experta en microbiología y remediación de suelos. Dirección estratégica e innovación.'), visible: true },
  { id: 'alexandre', image: 'equipe-alexandre', nom: 'Alexandre Geoffroy', role: T('Ingénieur de recherche', 'Research engineer', 'Ingeniero de investigación'), texte: T('Expert en symbioses mycorhiziennes et biologie moléculaire appliquée.', 'Expert in mycorrhizal symbioses and applied molecular biology.', 'Experto en simbiosis micorrícicas y biología molecular aplicada.'), visible: true },
  { id: 'johanna', image: 'equipe-johanna', nom: 'Johanna Finck', role: T('Technicienne de laboratoire', 'Laboratory technician', 'Técnica de laboratorio'), texte: T('Suivi des expérimentations et récolte des données de terrain.', 'Monitoring experiments and collecting field data.', 'Seguimiento de los experimentos y recogida de datos de campo.'), visible: true },
  { id: 'jeanclaude', image: 'equipe-jeanclaude', nom: 'Jean-Claude Cleyet-Marel', role: T('Expert senior', 'Senior expert', 'Experto sénior'), texte: T('Ancien directeur de recherche à l’INRA. Spécialiste en phytoremédiation.', 'Former research director at INRA. Phytoremediation specialist.', 'Antiguo director de investigación en el INRA. Especialista en fitorremediación.'), visible: true },
];

// ---------------------------------------------------------------------------
// Partenaires (logos public/images/partenaire-N.webp)
// ---------------------------------------------------------------------------
const PARTENAIRES_NOMS = ['INRAE', 'CBS Fungal Biodiversity Centre', 'Université de Montpellier', 'IRD', 'CIRAD', 'CNRS', 'Agropolis Fondation', 'Région Occitanie', 'Bpifrance', 'French Tech', 'Europe Innov', 'ADEME', 'FranceAgriMer', 'ANR', 'UE Horizon', 'Axelera', 'Crisalid', 'Hortsys', 'Agri Sud-Ouest', 'Suez', 'Veolia', 'Eiffage', 'Vinci', 'Bouygues', 'Colas', 'Eurovia', 'Lafarge', 'Imerys', 'Omya', 'Yara'];
export const PARTENAIRES = PARTENAIRES_NOMS.map((nom, i) => ({ id: `p${i + 1}`, nom, image: `partenaire-${i + 1}`, visible: true }));

// ---------------------------------------------------------------------------
// Réalisations (accueil)
// ---------------------------------------------------------------------------
export const REALISATIONS = [
  { id: 'montpellier', image: 'site-rehabilite', categorie: T('Remédiation', 'Remediation', 'Remediación'), titre: T('Site industriel réhabilité', 'Rehabilitated industrial site', 'Sitio industrial rehabilitado'), lieu: 'Montpellier, France', visible: true },
  { id: 'beziers', image: 'terrain-1', categorie: T('Agriculture bio', 'Organic farming', 'Agricultura ecológica'), titre: T('Vignoble en conversion bio', 'Vineyard converting to organic', 'Viñedo en conversión ecológica'), lieu: 'Béziers, France', visible: true },
  { id: 'toulouse', image: 'racines', categorie: T('Phytoremédiation', 'Phytoremediation', 'Fitorremediación'), titre: T('Dépollution par les plantes', 'Plant-based decontamination', 'Descontaminación con plantas'), lieu: 'Toulouse, France', visible: true },
  { id: 'nimes', image: 'sol-profil', categorie: T('Restauration', 'Restoration', 'Restauración'), titre: T('Technosol fertile', 'Fertile technosol', 'Tecnosuelo fértil'), lieu: 'Nîmes, France', visible: true },
  { id: 'perpignan', image: 'microscope', categorie: T('Microbiologie', 'Microbiology', 'Microbiología'), titre: T('Diagnostic avancé', 'Advanced diagnosis', 'Diagnóstico avanzado'), lieu: 'Perpignan, France', visible: true },
];

// ---------------------------------------------------------------------------
// Pourquoi nous / processus / chiffres (accueil + page Chiffres)
// ---------------------------------------------------------------------------
export const POURQUOI = [
  { id: 'science', emoji: '🔬', titre: T('Science de pointe', 'Cutting-edge science', 'Ciencia de vanguardia'), texte: T('Séquençage NGS, métagénomique et IA pour un diagnostic microbiologique millimétré. Nos résultats reposent sur des données, pas sur des suppositions.', 'NGS sequencing, metagenomics and AI for pinpoint microbiological diagnosis. Our results rest on data, not assumptions.', 'Secuenciación NGS, metagenómica e IA para un diagnóstico microbiológico milimétrico. Nuestros resultados se basan en datos, no en suposiciones.'), points: [T('5 000+ souches microbiennes certifiées', '5,000+ certified microbial strains', 'Más de 5.000 cepas microbianas certificadas'), T('Partenariats INRAE, CNRS, Université de Montpellier', 'Partnerships with INRAE, CNRS, University of Montpellier', 'Colaboraciones con INRAE, CNRS, Universidad de Montpellier'), T('15+ brevets déposés', '15+ patents filed', 'Más de 15 patentes registradas')], visible: true },
  { id: 'impact', emoji: '🌍', titre: T('Impact mesurable', 'Measurable impact', 'Impacto medible'), texte: T('Chaque intervention est suivie d’indicateurs scientifiques concrets. Vous voyez la progression, pas seulement les promesses.', 'Every intervention is tracked with concrete scientific indicators. You see the progress, not just the promises.', 'Cada intervención se acompaña de indicadores científicos concretos. Usted ve el progreso, no solo las promesas.'), points: [T('+40 % de rendement moyen', '+40% average yield', '+40 % de rendimiento medio'), T('−80 % de polluants en 24 mois', '−80% pollutants in 24 months', '−80 % de contaminantes en 24 meses'), T('98 % de satisfaction clients', '98% client satisfaction', '98 % de satisfacción de clientes'), T('500+ diagnostics réalisés', '500+ diagnoses completed', 'Más de 500 diagnósticos realizados')], visible: true },
  { id: 'ecologique', emoji: '🌱', titre: T('100 % écologique', '100% ecological', '100 % ecológico'), texte: T('Zéro intrant chimique. Nos solutions biologiques respectent les équilibres naturels et s’inscrivent dans une agriculture véritablement régénérative.', 'Zero chemical inputs. Our biological solutions respect natural balances and belong to truly regenerative agriculture.', 'Cero insumos químicos. Nuestras soluciones biológicas respetan los equilibrios naturales y se inscriben en una agricultura verdaderamente regenerativa.'), points: [T('Certifié ISO 14001 & ISO 14064-2', 'ISO 14001 & ISO 14064-2 certified', 'Certificado ISO 14001 e ISO 14064-2'), T('Conformité Agriculture Biologique UE', 'EU Organic Farming compliance', 'Conformidad Agricultura Ecológica UE'), T('JEI reconnue par le Ministère', 'JEI status recognised by the Ministry', 'JEI reconocida por el Ministerio')], visible: true },
];

export const PROCESSUS = [
  { id: 'diagnostic', emoji: '🗺️', titre: T('Diagnostic terrain', 'Field diagnosis', 'Diagnóstico de campo'), texte: T('Prélèvements, analyses PCR/NGS, cartographie SIG de vos sols.', 'Sampling, PCR/NGS analyses, GIS mapping of your soils.', 'Muestreo, análisis PCR/NGS, cartografía SIG de sus suelos.') },
  { id: 'rapport', emoji: '📋', titre: T('Rapport personnalisé', 'Personalised report', 'Informe personalizado'), texte: T('Rapport complet avec plan d’action sur mesure sous 1 à 2 mois.', 'Complete report with a tailored action plan within 1–2 months.', 'Informe completo con plan de acción a medida en 1–2 meses.') },
  { id: 'oeuvre', emoji: '⚗️', titre: T('Mise en œuvre', 'Implementation', 'Puesta en marcha'), texte: T('Application de biofertilisants, inoculations, phytomanagement.', 'Application of biofertilisers, inoculations, phytomanagement.', 'Aplicación de biofertilizantes, inoculaciones, fitogestión.') },
  { id: 'suivi', emoji: '📈', titre: T('Suivi & résultats', 'Monitoring & results', 'Seguimiento y resultados'), texte: T('Mesure des KPI, rapports d’impact, certification des gains.', 'KPI measurement, impact reports, certification of gains.', 'Medición de KPI, informes de impacto, certificación de las mejoras.') },
];

// Chiffres modifiables par le propriétaire (outil set_chiffres).
export const CHIFFRES = {
  projets: 117, projetsObjectif: 150, hectares: 325, hectaresObjectif: 500,
  satisfaction: 97, annees: 12, co2Tonnes: 850, arbresEquivalent: 12000,
  formations: 45, partenaires: 30, arbresPlantes: 3200,
  progression: [{ annee: 2021, pct: 12 }, { annee: 2022, pct: 34 }, { annee: 2023, pct: 55 }, { annee: 2024, pct: 73 }, { annee: 2025, pct: 91 }],
  sites: 200, projetsTotal: 357, rendement: 40, eau: 70, biodiversite: 40, co2Min: 4, co2Max: 4,
};

/** Valeur d'un champ multilingue dans une langue (repli : français, puis chaîne brute). */
export function L(v, lang = 'fr') {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v);
  return v[lang] || v.fr || Object.values(v)[0] || '';
}
