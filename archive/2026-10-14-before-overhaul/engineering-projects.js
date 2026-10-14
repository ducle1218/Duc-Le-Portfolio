/* Image-led case studies. Asset provenance lives in each project image folder. */
const ENGINEERING_PROJECTS = (() => {
  const root = 'src/assets/images/';
  const escape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const figure = (folder, file, title, caption, photo = false) => `<figure class="case-figure${photo ? ' case-figure--photo' : ''}"><img src="${root}${folder}/${file}" alt="${escape(title)}" loading="lazy" decoding="async"><figcaption><strong>${escape(title)}</strong> ${escape(caption)}</figcaption></figure>`;
  const facts = items => `<dl class="case-facts">${items.map(([label,value]) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
  const section = (number, date, title, intro, images) => `<section class="case-section"><header><p class="case-kicker">${number} / ${escape(date)}</p><h3>${escape(title)}</h3><p>${escape(intro)}</p></header><div class="case-gallery">${images.join('')}</div></section>`;
  const robot = (file, title, caption, photo) => figure('quadruped-robot', file + '.webp', title, caption, photo);
  const volume = (file, title, caption) => figure('volumetric-display', file + '.webp', title, caption);

  const quadruped = `<article class="case-study">
    <div class="case-hero"><div><p class="case-kicker">Mechanical design / October 2026</p><h2>Quadruped Robot</h2><span class="case-status">Prototype in progress</span><p class="case-lede">From servo packaging to a folding chassis: building a four-legged robot through CAD, printed parts, and hands-on fit checks.</p><p>My work focuses on Onshape modeling, assembly clearances, and print-efficient revisions. I recreated the initial body and head from teammate Ethan’s SolidWorks dimensions, then developed the changes shown here.</p><div class="case-tools"><span>Onshape</span><span>FDM printing</span><span>Mechanism design</span></div></div>${robot('standing-prototype','First standing prototype','Early physical assembly with three legs installed. The notebook later records all four legs attached and one leg actuated. October 4–5, 2026.', true)}</div>
    ${facts([['Body length','160 → 225 mm'],['Upper leg','143 → 135 mm'],['Build constraint','256 mm print bed'],['Demonstrated','One leg actuated']])}
    ${section('01','October 2–4','Make the CAD work on the bench.','Assembly exposed alignment and handedness issues. Each fit check fed directly into the next part revision.',[
      robot('servo-axis-alignment','Inspect the joint axes','Revolute mates exposed mounting holes offset from the servo axis, prompting a geometry correction.'),
      robot('split-body','Split the body for printing','Simpler geometry reduced printing complexity; the tradeoff was four additional assembly screws.'),
      robot('mirrored-fit-check','Catch a handedness error','A right-hand support did not fit the left side. Mirroring and reprinting corrected the mismatch.'),
      robot('assembled-prototype','Assemble all four legs','An informal bench check with a drill resting on the chassis. This photo documents assembly, not a rated load capacity.', true)
    ])}
    ${section('02','October 7–10','Turn loose fits into guided motion.','Refined the servo supports and leg interfaces to address play and guide the folding motion.',[
      robot('slotted-servo-mount','Locate the servo support','Added mating slots after the physical assembly showed horizontal and vertical play.'),
      robot('keyed-leg-support','Add a matching locating feature','A complementary feature on the leg support engages the head slots.'),
      robot('leg-rest-slot','Give the leg a resting position','A dedicated slot and chamfered edges guide the leg toward its intended stowed position.'),
      robot('folding-clearance','Check the folding envelope','Lengthened the support to give the leg more room around the chassis and electronics.')
    ])}
    ${section('03','October 8–11','Package four legs within a printable chassis.','The latest CAD balances a compact folded configuration with the printer’s build envelope.',[
      robot('revised-chassis','Lengthen and simplify the body','Increased body length from 160 to 225 mm while simplifying the frame for continued prototyping.'),
      robot('shortened-upper-leg','Shorten the upper leg','Reduced the link from 143 to 135 mm so the legs fit without further lengthening the body.'),
      robot('folded-configuration','Bring all four legs underneath','Latest CAD configuration shows all four legs packaged below the body. Physical folding validation is next.'),
      robot('workbench-build','Close the loop with physical work','Assembly and troubleshooting inform the next CAD revision. Shown working on the prototype, October 8.', true)
    ])}
    <aside class="case-note"><strong>A manufacturing tradeoff</strong><p>The notebook estimates 1 h 48 min for a horizontal body print versus more than 6 h vertically with supports. Shortening the leg preserved the faster print orientation; these are estimates, not measured production times.</p></aside>
    <section class="case-next"><p class="case-kicker">Next iteration</p><h3>Validate the fold, then coordinate the legs.</h3><p>Test the latest stowed geometry on hardware and extend control beyond the single actuated leg. Walking and tracking remain development goals.</p></section>
    <p class="case-source">Build record: engineering notebook, October 2–11, 2026. Images show the actual CAD and prototype at each stage.</p>
  </article>`;

  const volumetric = `<article class="case-study">
    <div class="case-hero"><div><p class="case-kicker">Mechanical development / August 2026</p><h2>Volumetric Display</h2><span class="case-status">CAD &amp; preliminary analysis</span><p class="case-lede">Designing the rotating structure for a swept-volume LED display: from a solid wall concept to a modular, 20-arm assembly.</p><p>The work so far centers on rotor geometry, printable connections, motor packaging, and early structural models. Electronics synchronization and a working display are still ahead.</p><div class="case-tools"><span>SolidWorks</span><span>Onshape FEA</span><span>Design for printing</span></div></div>${volume('radial-arm-assembly','The 20-arm rotor assembly','Latest mechanical concept with radial supports, a central shaft, and a ventilated base. CAD study, August 11, 2026.')}</div>
    ${facts([['Rotor concept','20 radial arms'],['Connection','Modular snap fit'],['Manufacturing','Split printable shaft'],['Current stage','Mechanical CAD']])}
    ${section('01','August 4–7','Start with the volume and its enclosure.','Early sketches explored how a rotating surface could carry LEDs and fit above a stationary base.',[
      volume('early-rotor-concept','Sketch the swept surface','Initial concept study for the rotating display structure.'),
      volume('early-enclosure','Package the stationary base','Early enclosure layout establishes space around the motor and rotating surface.'),
      volume('wall-rotor','Build the first wall concept','A broad rotating wall provided a starting point for the mechanical layout.'),
      volume('snap-fit-sketch','Work through the connection','A hand sketch explores how the rotating structure could connect to the center shaft.')
    ])}
    ${section('02','August 7–11','Replace the wall with modular arms.','The design moved toward thinner radial supports to accommodate LEDs, make scaling easier, and reduce exposed area. Drag reduction remains a design intent.',[
      volume('radial-arm-sketch','Change the rotor architecture','Sketch of the radial-arm alternative to the broad wall.'),
      volume('arm-connection','Refine the arm-to-shaft interface','Detailed connection geometry for the modular support arm.'),
      volume('shaft-snap-detail','Develop the shaft connection','Earlier retaining features locate the original support wall on the shaft.'),
      volume('radial-arm-assembly','Assemble the new architecture','Twenty radial supports replace the broad rotating wall in the revised CAD model.')
    ])}
    ${section('03','August 6–11','Design around the motor and printer.','The center assembly has to transmit motion, route power, and fit the available printer.',[
      volume('shaft-coupling','Connect the rotor to the motor','Coupling geometry integrates the center shaft with the motor attachment.'),
      volume('slip-ring-packaging','Reserve space for power transfer','CAD packaging study around the motor and slip ring. Electrical operation has not yet been demonstrated.'),
      volume('modular-wall','Simplify the enclosure segment','An earlier solid wall segment brought the slicer estimate to about 1 h 20 min. This is an enclosure part, not the rotor.'),
      volume('enclosure-slicing','Review the perforated enclosure','Slicer study of a later ventilated segment, with an estimated print time of roughly two hours.')
    ])}
    <aside class="case-note"><strong>Design for the available machine</strong><p>The center shaft was split into printable sections to fit the Prusa Mini’s approximately 7-inch build envelope. The connection is part of the design, not an afterthought.</p></aside>
    ${section('04','August 12','Use simulation to guide the next questions.','Two preliminary models examine different components and loads. They are starting points for refinement and physical testing.',[
      volume('shaft-simulation','Center shaft · angular-velocity model','The notebook specifies approximately 4,500°/s for the shaft model. The screenshot retains the simulation tree and stress legend.'),
      volume('arm-simulation','Support arm · preliminary force model','The arm plot reports about 23 psi peak stress under a modeled 0.28 lbf load. Three support arms approximate the center constraint.')
    ])}
    <aside class="case-note"><strong>What this result establishes</strong><p>The ~23 psi value belongs to the arm model. Printed-material behavior, constraints, mesh convergence, balance, and dynamic loading still require validation; this result does not establish a safe operating speed.</p></aside>
    <section class="case-next"><p class="case-kicker">Next iteration</p><h3>Move from a mechanical model to tested hardware.</h3><p>Print and check the joints, refine the structural assumptions, then develop guarded spin testing and LED timing. The notebook does not yet document a functioning display.</p></section>
    <p class="case-source">Design record: engineering notebook, August 4–12, 2026. All images are project sketches, CAD, or simulation views.</p>
  </article>`;

  const fea = `<article class="case-study">
    <div class="case-hero"><div><p class="case-kicker">Structural analysis / 2026</p><h2>FEA &amp; GD&amp;T</h2><span class="case-status">Preliminary assembly analysis</span><p class="case-lede">Tracing the load path through a two-plate robot aligner: from applied forces to stress concentrations around the geometry.</p><p>The aligner helps square the VEX robot against a surface. This study examines the plate-and-spacer assembly under defined loads, with critical fits and drawing documentation as the next step.</p><div class="case-tools"><span>Onshape FEA</span><span>Assembly loading</span><span>Printed-part design</span></div></div>${figure('fea','aligner-load-stress.png','Aligner under load','Stress contour of the two-plate aligner assembly. The supplied plot does not display stress units; colors show the distribution within this model.')}</div>
    ${facts([['Assembly','Two plates + spacers'],['Load per plate','−200 lbf in Y'],['Model','Two applied forces'],['Focus','Load path & local stress']])}
    ${section('01','Define the load case','Make the applied forces traceable.','Each selected plate has a separate force definition: X = 0 lbf, Y = −200 lbf, Z = 0 lbf. These are model inputs, not a demonstrated load rating.',[
      figure('fea','lower-plate-load.png','Force 1 · lower plate','Part 1 <1> is selected with a −200 lbf Y-direction force. The screenshot records the selected instance and load components.'),
      figure('fea','upper-plate-load.png','Force 2 · upper plate','Part 1 <2> carries a second −200 lbf Y-direction force. Both load definitions act within the same assembly.')
    ])}
    ${section('02','Read the result','Follow the load through the geometry.','The contour highlights local variation around the holes, cutout corners, and spacer interfaces. These regions guide where to inspect the mesh, connections, and geometry in the next iteration.',[
      figure('fea','aligner-load-stress.png','Assembly stress distribution','The image preserves the original legend and complete plate geometry. Quantitative interpretation requires the result type, units, material properties, and constraints.')
    ])}
    <aside class="case-note"><strong>Analysis status</strong><p>This is a preliminary model. The setup screenshots show warnings, and the supplied evidence does not establish resolved constraints, mesh convergence, or a factor of safety. Those checks are required before using the result to substantiate a design load.</p></aside>
    <section class="case-next"><p class="case-kicker">Next iteration</p><h3>Connect the model to a manufacturable part.</h3><p>Document the load rationale and material inputs, resolve model warnings, check mesh sensitivity, and define the critical plate-and-spacer fits in a toleranced drawing.</p></section>
    <p class="case-source">Evidence: owner-supplied Onshape stress contour and Force 1 / Force 2 setup screenshots. GD&amp;T drawing work remains in progress.</p>
  </article>`;

  return { quadruped, volumetric, fea };
})();
