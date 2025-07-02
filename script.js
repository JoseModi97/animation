window.addEventListener('load', () => {
    const canvas = document.getElementById('gifCanvas');
    const ctx = canvas.getContext('2d');
    const gifPath = '11162606.gif'; // Assuming the GIF is in the same directory

    let player = null;
    let frames = [];
    let gifWidth = 100; // Default width
    let gifHeight = 100; // Default height

    // --- Gifler loading ---
    gifler(gifPath).frames(canvas, (renderer, frame) => {
        // This callback is called for each frame during the initial decoding phase
        // We can capture the frames and gif dimensions here.
        // The 'renderer' object is the Player instance.
        if (!player) {
            player = renderer;
            gifWidth = player.width || frame.width || canvas.width;
            gifHeight = player.height || frame.height || canvas.height;

            // Set canvas intrinsic size to GIF dimensions
            canvas.width = gifWidth;
            canvas.height = gifHeight;

            // Ensure CSS scaling applies correctly from the start
            // (already handled by max-width/max-height in CSS)
        }

        // Store frame data if needed, though gifler's renderer handles it.
        // For our purpose, knowing the total number of frames is key,
        // which we can get from player.frames.length after it's fully processed.

        // For now, we'll draw the first frame once everything is ready.
        // The `animate()` method would typically start playing all frames.
        // We want manual control.
    }).then(renderer => {
        // This .then() is called after all frames are processed by .frames()
        player = renderer; // Ensure player is the fully initialized renderer
        frames = player.frames;

        if (frames.length > 0) {
            // 1. Set canvas dimensions (already done if first frame was processed by .frames())
            if (canvas.width !== gifWidth || canvas.height !== gifHeight) {
                gifWidth = player.width || frames[0].width;
                gifHeight = player.height || frames[0].height;
                canvas.width = gifWidth;
                canvas.height = gifHeight;
            }

            // 2. Draw the first frame
            player.renderFrame(0, ctx, 0, 0);

            // 3. Set body height for scrolling
            // Let's assume each frame corresponds to a certain number of scroll pixels
            const scrollPixelsPerFrame = 20; // Adjust for desired scroll sensitivity
            document.body.style.height = (frames.length * scrollPixelsPerFrame) + 'px';

            // 4. Add scroll event listener
            window.addEventListener('scroll', handleScroll, { passive: true });
        } else {
            console.error("GIF could not be loaded or contains no frames.");
        }
    }).catch(err => {
        console.error("Error loading or processing GIF:", err);
    });

    function handleScroll() {
        if (!player || frames.length === 0) return;

        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const maxScrollTop = document.body.scrollHeight - window.innerHeight;

        let scrollFraction = 0;
        if (maxScrollTop > 0) {
            scrollFraction = scrollTop / maxScrollTop;
        } else {
            scrollFraction = 0; // Or 1, depending on desired behavior at no scroll
        }

        const frameIndex = Math.min(
            frames.length - 1,
            Math.floor(scrollFraction * frames.length)
        );

        // Request animation frame for smoother rendering, though direct render is also fine
        requestAnimationFrame(() => {
            // player.renderFrame expects the canvas context, not the canvas element itself
            // and it uses its internal frame buffer, but needs context to draw to the target canvas.
            // The `gifler(gifPath).frames(canvas, onFrame)` method already ties the player to the canvas.
            // The `player.renderFrame(index)` should draw to the initially provided canvas.
            // However, the gifler API is a bit opaque from the docs.
            // Let's re-check the `renderFrame` signature from the source.
            // `Player.prototype.renderFrame = function(frameIndex, ctx, x, y)`
            // It seems `renderFrame` needs the context, x, and y.
            // For drawing the whole frame at 0,0 of the canvas:
            player.renderFrame(frameIndex, ctx, 0, 0);
        });
    }
});
