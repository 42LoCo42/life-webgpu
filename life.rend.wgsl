struct Params {
	width: u32,
	height: u32,
};

@group(0) @binding(0) var<storage, read> src: array<u32>;
@group(0) @binding(1) var<uniform> params: Params;

struct VertexOut {
	@builtin(position) position: vec4<f32>,
};

@vertex
fn vert_main(@builtin(vertex_index) index: u32) -> VertexOut {
	// cover entire clip space with a 2-triangle strip
	let positions = array<vec2<f32>, 4>(
		vec2<f32>(01.0, 01.0),
		vec2<f32>(01.0, -1.0),
		vec2<f32>(-1.0, 01.0),
		vec2<f32>(-1.0, -1.0),
	);

	return VertexOut(vec4<f32>(positions[index], 0.0, 1.0));
}

@fragment
fn frag_main(@builtin(position) pos: vec4<f32>) -> @location(0) vec4<f32> {
	let x = min(u32(pos.x), params.width - 1u);
	let y = min(u32(pos.y), params.height - 1u);
	let cur = src[y * params.width + x];
	let colors = array<vec3<f32>, 4>(
		vec3<f32>(0.0),
		vec3<f32>(1.0, 0.0, 0.0),
		vec3<f32>(1.0, 0.5, 0.0),
		vec3<f32>(1.0, 1.0, 0.0),
	);
	let color = colors[cur];
	return vec4<f32>(color, 1.0);
}
