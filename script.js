import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

class SplitText {
    constructor(selector, options = {}) {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return;
        
        const element = elements[0];
        const type = options.type || 'chars';
        const charsClass = options.charsClass || 'char';
        const linesClass = options.linesClass || 'line';
        
        if (type === 'chars') {
            this.char = this.splitIntoChars(element, charsClass);
        } else if (type === 'lines') {
            this.lines = this.splitIntoLines(element, linesClass);
        }
    }
    
    splitIntoChars(element, charsClass) {
        const text = element.textContent;
        const chars = [];
        element.innerHTML = '';
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            if (char === ' ') {
                element.appendChild(document.createTextNode(' '));
            } else {
                const span = document.createElement('span');
                span.className = charsClass;
                span.textContent = char;
                element.appendChild(span);
                chars.push(span);
            }
        }
        
        return chars;
    }
    
    splitIntoLines(element, linesClass) {
        const text = element.textContent.trim();
        if (!text) return [];
        
        const computedStyle = window.getComputedStyle(element);
        const elementWidth = element.offsetWidth || element.clientWidth;
        
        const tempContainer = document.createElement('div');
        tempContainer.style.position = 'absolute';
        tempContainer.style.visibility = 'hidden';
        tempContainer.style.width = elementWidth + 'px';
        tempContainer.style.whiteSpace = 'normal';
        tempContainer.style.wordWrap = 'break-word';
        tempContainer.style.padding = computedStyle.padding;
        tempContainer.style.fontSize = computedStyle.fontSize;
        tempContainer.style.fontFamily = computedStyle.fontFamily;
        tempContainer.style.fontWeight = computedStyle.fontWeight;
        tempContainer.style.lineHeight = computedStyle.lineHeight;
        tempContainer.style.letterSpacing = computedStyle.letterSpacing;
        document.body.appendChild(tempContainer);
        
        const words = text.split(/\s+/);
        const lines = [];
        let currentLine = [];
        let currentLineWidth = 0;
        
        words.forEach((word, index) => {
            const testSpan = document.createElement('span');
            testSpan.style.whiteSpace = 'nowrap';
            testSpan.textContent = word + (index < words.length - 1 ? ' ' : '');
            tempContainer.appendChild(testSpan);
            
            const wordWidth = testSpan.offsetWidth;
            const spaceWidth = currentLine.length > 0 ? 5 : 0;
            
            if (currentLineWidth + spaceWidth + wordWidth > elementWidth && currentLine.length > 0) {
                const lineSpan = document.createElement('span');
                lineSpan.className = linesClass;
                lineSpan.style.display = 'block';
                lineSpan.textContent = currentLine.join(' ');
                lines.push(lineSpan);
                
                currentLine = [word];
                currentLineWidth = wordWidth;
            } else {
                currentLine.push(word);
                currentLineWidth += spaceWidth + wordWidth;
            }
            
            tempContainer.removeChild(testSpan);
        });
        
        if (currentLine.length > 0) {
            const lineSpan = document.createElement('span');
            lineSpan.className = linesClass;
            lineSpan.style.display = 'block';
            lineSpan.textContent = currentLine.join(' ');
            lines.push(lineSpan);
        }
        
        document.body.removeChild(tempContainer);
        
        element.innerHTML = '';
        lines.forEach(line => element.appendChild(line));
        
        return lines;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis();
    lenis.on("scroll",ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const header1Split = new SplitText(".header-1 h1", {
        type: "chars",
        charsClass: "char"
    });

    const titleSplit = new SplitText(".tooltip .title h2", {
        type: "lines",
        linesClass: "line"
    });

    const descriptionSplit = new SplitText(".tooltip .description p", {
        type: "lines",
        linesClass: "line"
    });

    if (header1Split && header1Split.char) {
        header1Split.char.forEach(
            (char) => (char.innerHTML = `<span>${char.innerHTML}</span>`)
        );
    }

    const allLines = [
        ...(titleSplit?.lines || []),
        ...(descriptionSplit?.lines || [])
    ];
    
    allLines.forEach(
        (line) => (line.innerHTML = `<span>${line.innerHTML}</span>`)
    );

    const animOptions = {
        duration: 1,
        ease: "power3.inOut",
        stagger: 0.025
    };

    const tooltipSelectors = [
        {
            trigger: 0.65,
            elements: [
                ".tooltip:nth-child(1) .icon ion-icon",
                ".tooltip:nth-child(1) .title .line > span",
                ".tooltip:nth-child(1) .description .line > span",
            ]
        }
    ];

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const allTooltipElements = document.querySelectorAll(
                '.tooltip .icon ion-icon, ' +
                '.tooltip .title .line > span, ' +
                '.tooltip .description .line > span'
            );
            
            allTooltipElements.forEach(el => {
                el.style.setProperty('opacity', '0', 'important');
                el.style.setProperty('visibility', 'hidden', 'important');
                el.style.setProperty('transform', 'translateY(125%) scale(0.8)', 'important');
            });
        });
    });
    
    gsap.set(".header-1 h1 .char > span", {
        y: "100%",
        immediateRender: true,
        force3D: true
    });

    ScrollTrigger.create({
        trigger: ".products-overview",
        start: "75% bottom",
        onEnter: () => {
            gsap.to(".header-1 h1 .char > span", {
                y: "0%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
                force3D: true
            });
        },
        onLeaveBack: () => {
            gsap.to(".header-1 h1 .char > span", {
                y: "100%",
                duration: 1,
                ease: "power3.out",
                stagger: 0.025,
                force3D: true
            });
        }
    });
    
    let model, currentRotation = 0, modelSize;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.toneMappingExposure = 1;
    document.querySelector(".motion-container").appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));

    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(1, 2, 3);
    mainLight.castShadow = true;
    mainLight.shadow.bias = -0.001;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
    fillLight.position.set(-2, 0, -2);
    scene.add(fillLight);

    function setupModel() {
        if (!model || !modelSize) return;
        
        const isMobile = window.innerWidth < 1000;
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        
        model.position.set(
            isMobile ? center.x + modelSize.x * 1 : -center.x - modelSize.x * 0.4,
            -center.y + modelSize.y * 0.085,
            -center.z
        );

        model.rotation.z = isMobile ? 0 : THREE.MathUtils.degToRad(-25);

        const cameraDistance = isMobile ? 2 : 1.25;
        camera.position.set(0, 0, Math.max(modelSize.x, modelSize.y, modelSize.z) * cameraDistance);
        camera.lookAt(0, 0, 0);
    }

    const loader = new GLTFLoader();
    loader.load("./shaker.glb", (gltf) => {
        model = gltf.scene;

        model.traverse((node) => {
            if (node.isMesh && node.material) {
                Object.assign(node.material, {
                    metalness: 0.05,
                    roughness: 0.9,
                });
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        modelSize = box.getSize(new THREE.Vector3());

        scene.add(model);
        setupModel();
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }

    animate();

    let resizeTimeout;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            if (model) setupModel();
            ScrollTrigger.refresh();
        }, 100);
    });

    ScrollTrigger.create({
        trigger: ".products-overview",
        start: "top top",
        end: `+=${window.innerHeight*10}px`,
        pin: true,
        pinSpacing: true,
        scrub: 1,
        onUpdate: ({progress}) => {
            const headerProgress = Math.max(0, Math.min(1, (progress - 0.05) / 0.3));
            const header1XPercent = progress < 0.05 ? 0 : progress > 0.35 ? -100 : -100 * headerProgress;
            gsap.to(".header-1", { xPercent: header1XPercent, force3D: true });

            const maskSize = progress < 0.2 ? 0 : progress > 0.3 ? 100 : 100 * ((progress - 0.2) / 0.1);
            gsap.to(".circular-mask", { clipPath: `circle(${maskSize}% at 50% 50%)`, force3D: true });

            const header2Progress = (progress - 0.15) / 0.35;
            const header2XPercent = progress < 0.15 ? 100 : progress > 0.5 ? -200 : 100 - 300 * header2Progress;
            gsap.to(".header-2", { xPercent: header2XPercent, force3D: true });

            const scaleX = progress < 0.45 ? 0 : progress > 0.65 ? 100 : 100 * ((progress - 0.45) / 0.2);
            gsap.to(".tooltip .divider", { scaleX: `${scaleX}%`, duration: 0.3, ease: "power2.out", force3D: true });

            tooltipSelectors.forEach(({trigger, elements}) => {
                const foundElements = [];
                elements.forEach(selector => {
                    const els = document.querySelectorAll(selector);
                    if (els && els.length > 0) foundElements.push(...Array.from(els));
                });
                
                if (foundElements.length === 0) return;
                
                const revealRange = 0.25;
                const initialScale = 0.8;
                const finalScale = 1.0;
                
                if (progress < trigger) {
                    foundElements.forEach(el => {
                        el.style.setProperty('opacity', '0', 'important');
                        el.style.setProperty('visibility', 'hidden', 'important');
                        el.style.setProperty('transform', `translateY(125%) scale(${initialScale})`, 'important');
                    });
                } else {
                    const revealProgress = Math.min(1, (progress - trigger) / revealRange);
                    
                    foundElements.forEach((el, index) => {
                        const staggerTime = index * animOptions.stagger;
                        const elementProgress = Math.max(0, Math.min(1, revealProgress - (staggerTime / revealRange)));
                        const eased = elementProgress <= 0 ? 0 : gsap.parseEase("power3.out")(elementProgress);
                        const yPercent = 125 * (1 - eased);
                        const opacity = eased;
                        const scaleProgress = Math.min(1, elementProgress * 1.2);
                        const scaleEased = scaleProgress <= 0 ? 0 : gsap.parseEase("back.out(1.2)")(scaleProgress);
                        const scale = initialScale + ((finalScale - initialScale) * scaleEased);
                        const visibility = elementProgress > 0 ? "visible" : "hidden";
                        
                        el.style.setProperty('opacity', opacity, 'important');
                        el.style.setProperty('visibility', visibility, 'important');
                        el.style.setProperty('transform', `translateY(${yPercent}%) scale(${scale})`, 'important');
                    });
                }
            });

            if (model && progress >= 0.05) {
                const rotationProgress = (progress - 0.05) / 0.95;
                const targetRotation = Math.PI * 3 * rotationProgress;
                const rotationDiff = targetRotation - currentRotation;
                
                if (Math.abs(rotationDiff) > 0.01) {
                    model.rotateOnAxis(new THREE.Vector3(0, 1, 0), rotationDiff);
                    currentRotation = targetRotation;
                }
            }
        }
    });
});
