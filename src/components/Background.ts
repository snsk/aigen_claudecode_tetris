export function renderBackground(): HTMLElement {
  const backgroundDiv = document.createElement('div');
  backgroundDiv.className = 'background';
  backgroundDiv.innerHTML = `
    <!-- Sky gradient -->
    <div class="sky" data-time="morning"></div>
    
    <!-- Animated clouds -->
    <div class="clouds">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
      <div class="cloud cloud-4"></div>
    </div>
    
    <!-- Mountains -->
    <div class="mountains">
      <div class="mountain mountain-1"></div>
      <div class="mountain mountain-2"></div>
      <div class="mountain mountain-3"></div>
    </div>
    
    <!-- Trees -->
    <div class="forest">
      <div class="tree tree-1"></div>
      <div class="tree tree-2"></div>
      <div class="tree tree-3"></div>
      <div class="tree tree-4"></div>
      <div class="tree tree-5"></div>
    </div>
    
    <!-- River -->
    <div class="river">
      <div class="water"></div>
      <div class="ripple ripple-1"></div>
      <div class="ripple ripple-2"></div>
      <div class="ripple ripple-3"></div>
    </div>
    
    <!-- Floating particles for ambience -->
    <div class="particles">
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
      <div class="particle"></div>
    </div>
  `;
  return backgroundDiv;
}

export function updateBackgroundTime(level: number): void {
  const skyElement = document.querySelector('.sky') as HTMLElement;
  if (!skyElement) return;

  // Map level to time of day (7 time periods)
  const times = ['dawn', 'morning', 'noon', 'afternoon', 'sunset', 'dusk', 'night'];
  const timeIndex = Math.min(Math.floor(level / 3), times.length - 1); // Change every 3 levels
  
  skyElement.setAttribute('data-time', times[timeIndex]);
}