export class Gifa11y {

	options: any
	src: string

	constructor(options:any) {
		let defaultConfig = {
			buttonPlayIconID: '',
			buttonPauseIconID: '',
			buttonPlayIconHTML: '',
			buttonPauseIconHTML: '',
            gif: null,
			inheritClasses: true,
			initiallyPaused: false,
			restartOnPlay: false,
			langPause: 'Pause animation:',
			langPlay: 'Play animation:',
			langPauseAllButton: 'Pause all animations',
			langPlayAllButton: 'Play all animations',
			langMissingAlt: 'Animated GIF.'
		};
		this.options = { ...defaultConfig, ...options }
		this.initialize()
		this.src = this.options.gif.src
	}
	
	initialize() {
        this.generateStill();
        this.prepareButtons();
	}

	generateStill () {

		let waitForImage = ($el:any) => {
			let ext;
			ext = $el.src.split('.');
			ext = ext[ext.length - 1].toLowerCase();
			ext = ext.substring(0, 4);
			if (ext === 'gif') {
				const canvas = document.createElement('canvas');

				//Calculate total border width... otherwise layout shifts.
				let borderLeft = parseFloat(
						getComputedStyle($el, null).getPropertyValue('border-left-width')
					),
					borderRight = parseFloat(
						getComputedStyle($el, null).getPropertyValue('border-right-width')
					),
					totalBorderWidth = borderLeft + borderRight,
					gifWidth = $el.getAttribute('width');

				//If width wasn't manually specified on GIF.
				if (gifWidth !== null) {
					canvas.width = gifWidth;

					//Prevent layout shifts when width is manually specified on image.
					canvas.setAttribute('style', 'width:' + gifWidth + 'px !important;');
				} else {

					//If rendered or clientWidth of image is 0, use naturalWidth as fallback.
					if ($el.clientWidth == 0) {
						canvas.width = $el.naturalWidth + 0.5 + totalBorderWidth;
					} else {
						//Why 0.5? Apparently canvas calculates from half a pixel... otherwise layout shifts. Thanks to: https://stackoverflow.com/a/13879402
						canvas.width = $el.clientWidth + 0.5 + totalBorderWidth;
					}
				}

				// Calculate gif height keeping aspect ratio.
				const newHeight = ( $el.naturalHeight / $el.naturalWidth ) * canvas.width;
				canvas.height = newHeight + 0.5;

				canvas.setAttribute('role', 'img');

				//Grab all classes from the original image.
				if (this.options.inheritClasses === true) {
					let cssClasses = $el.getAttribute('class');
					if (cssClasses == null) cssClasses = '';
					canvas.setAttribute('class', 'gifa11y-canvas' + ' ' + cssClasses);
				} else {
					canvas.setAttribute('class', 'gifa11y-canvas');
				}

				//Set alt on canvas.
				let alt = $el.getAttribute('alt');
				if (alt == null || alt == '' || alt == ' ') alt = this.options.langMissingAlt;
				canvas.setAttribute('aria-label', alt);

				const filename = $el.src,
					mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
				//If content author wants GIF to be paused initially (or prefers reduced motion).
				if (
					!mediaQuery ||
					mediaQuery.matches ||
					$el.classList.contains('gifa11y-paused') ||
					filename.indexOf('gifa11y-paused') > -1 ||
					this.options.initiallyPaused === true
				) {
					$el.style.display = 'none';
					$el.setAttribute('data-gifa11y-state', 'paused');
				} else {
					canvas.style.display = 'none';
					$el.setAttribute('data-gifa11y-state', 'playing');
				}

				//Generate canvas and insert after GIF.
				const canvasContext:any = canvas.getContext('2d');
				canvasContext.drawImage($el, 0, 0, canvas.width, canvas.height);
				$el.after(canvas);
			}
			
		};
		//Timing is important. Wait for each image to load before generating a still.
		if (this.options.gif.complete) waitForImage(this.options.gif);
		else this.options.gif.addEventListener('load', () => waitForImage(this.options.gif))
	}

	prepareButtons () {

		let waitForImage = ($el:any) => {
			const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)'),
				  findCanvas = $el.nextElementSibling;

			let initialState,
				currentState,
				pauseDisplay,
				playDisplay,
				filename = $el.src;
			if (
				!mediaQuery ||
				mediaQuery.matches ||
				$el.classList.contains('gifa11y-paused') ||
				filename.indexOf('gifa11y-paused') > -1 ||
				this.options.initiallyPaused === true
			) {
				initialState = this.options.langPlay;
				playDisplay = 'block';
				pauseDisplay = 'none';
				currentState = 'paused';
			} else {
				initialState = this.options.langPause;
				playDisplay = 'none';
				pauseDisplay = 'block';
				currentState = 'playing';
			}

			//If alt is missing, indicate as such on button label and canvas element.
			let alt = $el.getAttribute('alt');
			if (alt == null || alt == '' || alt == ' ') alt = this.options.langMissingAlt;

			//Create button
			const pauseButton = document.createElement('button'),
					defaultPlayIcon = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="m11.596 8.697-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>`,
					defaultPauseIcon = `<svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 16"><path d="M5.5 3.5A1.5 1.5 0 0 1 7 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5zm5 0A1.5 1.5 0 0 1 12 5v6a1.5 1.5 0 0 1-3 0V5a1.5 1.5 0 0 1 1.5-1.5z"/></svg>`;

			pauseButton.classList.add('gifa11y-btn');
			pauseButton.setAttribute('aria-label', initialState + ' ' + alt);
			pauseButton.setAttribute('data-gifa11y-state', currentState);
			pauseButton.setAttribute('data-gifa11y-alt', alt);
			pauseButton.innerHTML = `<div class="gifa11y-pause-icon" aria-hidden="true" style="display: ${pauseDisplay}"></div><div class="gifa11y-play-icon" aria-hidden="true" style="display: ${playDisplay}"></div>`;
			const pauseIcon = pauseButton.querySelector('.gifa11y-pause-icon'),
					playIcon = pauseButton.querySelector('.gifa11y-play-icon');

			//Pause icon.
			if (pauseIcon) {
				if (this.options.buttonPauseIconID.length > 1) {
					//If icon is supplied via ID on page.
					const customPauseIcon = document.getElementById(this.options.buttonPauseIconID)?.innerHTML;
					pauseIcon.innerHTML = customPauseIcon || '';
				} else if (this.options.buttonPauseIconHTML.length > 1) {
					//If icon is supplied via icon font or HTML.
					pauseIcon.innerHTML = this.options.buttonPauseIconHTML;
				} else {
					pauseIcon.innerHTML = defaultPauseIcon;
				}
			}

			//Play icon.
			if (playIcon) {
				if (this.options.buttonPlayIconID.length > 1) {
					//If icon is supplied via ID on page.
					const customPlayIcon = document.getElementById(this.options.buttonPlayIconID)?.innerHTML;
					playIcon.innerHTML = customPlayIcon || '';
				} else if (this.options.buttonPlayIconHTML.length > 1) {
					//If icon is supplied via icon font or HTML.
					playIcon.innerHTML = this.options.buttonPlayIconHTML;
				} else {
					playIcon.innerHTML = defaultPlayIcon;
				}
			}

			// If gif is within a hyperlink, insert button before it.
			if ($el.closest('a[href]')) {
				$el.closest('a[href]').insertAdjacentElement('beforebegin', pauseButton);
			} else {
				$el.insertAdjacentElement('beforebegin', pauseButton);
			}

			pauseButton.addEventListener('click', (e) => {
				pauseButton.setAttribute('data-gifa11y-state',
					pauseButton.getAttribute('data-gifa11y-state') === 'paused' ? 'playing' : 'paused'
				);

				const play = pauseButton.querySelector('.gifa11y-play-icon') as HTMLElement,
					  pause = pauseButton.querySelector('.gifa11y-pause-icon') as HTMLElement;

				if (pauseButton.getAttribute('data-gifa11y-state') === 'paused') {
					if (this.options.restartOnPlay) $el.src = this.src
					$el.style.display = 'none';
					findCanvas.style.display = 'block';
					if (play) play.style.display = 'block';
					pause.style.display = 'none';
					pauseButton.setAttribute('aria-label', this.options.langPlay + ' ' + alt);
				} else {
					if (this.options.restartOnPlay) $el.src = this.src
					$el.style.display = 'block';
					findCanvas.style.display = 'none';
					play.style.display = 'none';
					pause.style.display = 'block';
					pauseButton.setAttribute('aria-label', this.options.langPause + ' ' + alt);
				}
				e.preventDefault();
			},
				false
			);
		}
		//Timing is also important here. Load buttons after image fully loads. Otherwise if user clicks button while it's still loading, the canvas still can't be generated.
		if (this.options.gif.complete) waitForImage(this.options.gif);
		else this.options.gif.addEventListener('load', () => waitForImage(this.options.gif))
	}

}
