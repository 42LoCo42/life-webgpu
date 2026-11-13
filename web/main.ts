import lifeComp from "./life.comp.wgsl?raw";
import lifeRend from "./life.rend.wgsl?raw";

(async () => {
	if (!navigator.gpu) throw new Error("WebGPU not supported");

	const adapter = await navigator.gpu.requestAdapter();
	if (!adapter) throw new Error("failed to get WebGPU adapter");

	const device = await adapter.requestDevice();

	const canvas = document.querySelector("canvas")!;
	const context = canvas.getContext("webgpu");
	if (!context) throw new Error("failed to get canvas WebGPU context");

	const format = navigator.gpu.getPreferredCanvasFormat();
	context.configure({ device, format, alphaMode: "opaque" });

	const compShader = device.createShaderModule({ code: lifeComp });
	const rendShader = device.createShaderModule({ code: lifeRend });

	const computePipeline = device.createComputePipeline({
		layout: "auto",
		compute: { module: compShader },
	});

	const renderPipeline = device.createRenderPipeline({
		layout: "auto",
		vertex: { module: rendShader },
		fragment: { module: rendShader, targets: [{ format }] },
		primitive: { topology: "triangle-strip" },
	});

	let current = 0;

	const width = 1920;
	const height = 1080;
	const cellCount = width * height;

	const initial = new Uint32Array(cellCount);

	const buffers = [0, 1].map(() =>
		device.createBuffer({
			size: initial.byteLength,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
		}),
	);

	function initialize() {
		initial.forEach((_, i) => (initial[i] = Math.random() < 0.005 ? 1 : 0));
		device.queue.writeBuffer(buffers[(current = 0)]!, 0, initial);
	}

	initialize();

	const params = new Uint32Array([width, height]);
	const paramsBuffer = device.createBuffer({
		size: params.byteLength,
		usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
	});

	device.queue.writeBuffer(paramsBuffer, 0, params);

	const computeGroups = buffers.map((_, i) =>
		device.createBindGroup({
			layout: computePipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: buffers[i]! },
				{ binding: 1, resource: buffers[1 - i]! },
				{ binding: 2, resource: paramsBuffer },
			],
		}),
	);

	const renderGroups = buffers.map((cells) =>
		device.createBindGroup({
			layout: renderPipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: cells },
				{ binding: 1, resource: paramsBuffer },
			],
		}),
	);

	enum Mode {
		Paused,
		Step,
		Running,
	}

	let mode: Mode = Mode.Running;

	function frame() {
		const encoder = device.createCommandEncoder();

		if (mode != Mode.Paused) {
			const computePass = encoder.beginComputePass();
			computePass.setPipeline(computePipeline);
			computePass.setBindGroup(0, computeGroups[current]);
			computePass.dispatchWorkgroups(
				Math.ceil(width / 8),
				Math.ceil(height / 8),
			);
			computePass.end();

			current = 1 - current;
		}

		const renderPass = encoder.beginRenderPass({
			colorAttachments: [
				{
					view: context!.getCurrentTexture().createView(),
					clearValue: { r: 0, g: 0, b: 0, a: 1 },
					loadOp: "clear",
					storeOp: "store",
				},
			],
		});
		renderPass.setPipeline(renderPipeline);
		renderPass.setBindGroup(0, renderGroups[current]);
		renderPass.draw(4);
		renderPass.end();

		device.queue.submit([encoder.finish()]);

		if (mode == Mode.Step) mode = Mode.Paused;
		requestAnimationFrame(frame);
	}

	frame();

	document.addEventListener("keydown", (e) => {
		switch (e.key) {
			case " ":
				mode = Mode.Step;
				break;

			case "f":
				if (document.fullscreenElement == null) {
					document.body.requestFullscreen();
				} else {
					document.exitFullscreen();
				}
				break;

			case "p":
				mode = mode == Mode.Paused ? Mode.Running : Mode.Paused;
				break;

			case "r":
				initialize();
				break;
		}
	});
})();
