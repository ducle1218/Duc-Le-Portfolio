/* A deliberate, user-controlled project spotlight. */
(() => {
  const projects = [
    ['box-12','Quadruped robot','A folding robot dog. From servo packaging to printed, working legs.','ROBOTICS / PROTOTYPE IN PROGRESS','quadruped-robot/hero-cutout.png'],
    ['box-7','Volumetric display','Twenty modular radial arms, designed to turn moving light into a 3D display.','MECHANISM DESIGN / DEVELOPMENT','volumetric-display/hero-cutout.png'],
    ['box-11','FEA & GD&T','Examining load paths, stress concentrations, and critical fits in a robot aligner.','STRUCTURAL ANALYSIS / STUDY','fea/hero-cutout.png'],
    ['box-6','VEX Pushback','Drivetrain, intake, and sensor integration for a competition robot.','COMPETITION ROBOTICS / BUILD','capstone/Sprocket_Robot_CAD.png']
  ];
  const image = document.getElementById('spotlight-image');
  const open = document.getElementById('spotlight-open');
  document.querySelectorAll('[data-spotlight]').forEach(button => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.spotlight);
      const [id,title,summary,tag,src] = projects[index];
      image.src = 'src/assets/images/' + src;
      image.alt = title;
      open.onclick = () => showProjectDetail(id);
      open.setAttribute('aria-label','View ' + title + ' project');
      document.getElementById('spotlight-title').textContent = title;
      document.getElementById('spotlight-summary').textContent = summary;
      document.getElementById('spotlight-tag').textContent = tag;
      document.getElementById('spotlight-count').textContent = '0' + (index + 1) + ' / 04';
      document.querySelectorAll('[data-spotlight]').forEach(item => item.setAttribute('aria-pressed',String(item === button)));
    });
  });
})();
