export function italicVertex(source, sourceId) {
  const renamed = source.replace(/\bvoid\s+main\s*\(\s*\)/, 'void previewTextMain()')
  if (renamed === source) throw new Error('The text vertex shader does not contain a main function.')
  return `in vec2 PreviewStyle;\n${renamed}\n#line 1 ${sourceId}\nvoid main() {
    previewTextMain();
    if (PreviewStyle.x > 0.5) {
        vec4 lineOrigin = ProjMat * ModelViewMat * vec4(0.0, PreviewStyle.y, 0.0, 1.0);
        float glyphY = (gl_Position.y - lineOrigin.y) / ProjMat[1][1];
        float italicOffset = 1.0 - 0.25 * glyphY;
        gl_Position.x += ProjMat[0][0] * italicOffset;
    }
}`
}
