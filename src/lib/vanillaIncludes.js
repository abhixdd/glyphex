export const vanillaIncludes = {
  'globals.glsl': `uniform vec2 ScreenSize;
uniform float GameTime;
uniform float GlintAlpha;
uniform float MenuBlurRadius;`,
  'dynamictransforms.glsl': `uniform mat4 ModelViewMat;
uniform vec4 ColorModulator;
uniform vec3 ModelOffset;
uniform mat4 TextureMat;
uniform float LineWidth;`,
  'projection.glsl': 'uniform mat4 ProjMat;',
  'fog.glsl': `uniform float FogStart;
uniform float FogEnd;
uniform vec4 FogColor;
uniform int FogShape;
uniform float FogEnvironmentalStart;
uniform float FogEnvironmentalEnd;
uniform float FogRenderDistanceStart;
uniform float FogRenderDistanceEnd;
float fog_spherical_distance(vec3 position) { return length(position); }
float fog_cylindrical_distance(vec3 position) { return max(length(position.xz), abs(position.y)); }
float fog_distance(mat4 modelView, vec3 position, int shape) { vec3 p = (modelView * vec4(position, 1.0)).xyz; return shape == 0 ? length(p) : max(length(p.xz), abs(p.y)); }
float fog_distance(vec3 position, int shape) { return shape == 0 ? length(position) : max(length(position.xz), abs(position.y)); }
float linear_fog_fade(float distance, float start, float end) { return 1.0 - smoothstep(start, end, distance); }
float linear_fog_value(float distance, float start, float end) { return smoothstep(start, end, distance); }
vec4 linear_fog(vec4 color, float distance, float start, float end, vec4 fogColor) { float amount = smoothstep(start, end, distance); return vec4(mix(color.rgb, fogColor.rgb, amount * fogColor.a), color.a); }
vec4 apply_fog(vec4 color, float sphericalDistance, float cylindricalDistance, float environmentalStart, float environmentalEnd, float renderStart, float renderEnd, vec4 fogColor) { float amount = max(smoothstep(environmentalStart, environmentalEnd, sphericalDistance), smoothstep(renderStart, renderEnd, cylindricalDistance)); return vec4(mix(color.rgb, fogColor.rgb, amount * fogColor.a), color.a); }`,
  'light.glsl': `vec4 minecraft_mix_light(vec3 light0, vec3 light1, vec3 normal, vec4 color) { float lighting = min(1.0, (max(0.0, dot(light0, normal)) + max(0.0, dot(light1, normal))) * 0.6 + 0.4); return vec4(color.rgb * lighting, color.a); }
vec4 minecraft_sample_lightmap(sampler2D lightmap, ivec2 uv) { return texelFetch(lightmap, clamp(uv / 16, ivec2(0), ivec2(15)), 0); }`,
  'sample_lightmap.glsl': 'vec4 sample_lightmap(sampler2D lightmap, ivec2 uv) { return texture(lightmap, clamp(vec2(uv) / 256.0, vec2(0.03125), vec2(0.96875))); }',
}
