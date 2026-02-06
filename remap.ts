/**
 * Remaps fields that were randomly renamed in the bundle.
 * This is because, while Vape for Miniblox was still maintained, vector was renaming fields to random stuff.
 * xylex's solution (see https://codeberg.org/RealPacket/VapeForMiniblox/commit/30c4233603ee53e3bdcc445da0bdd6b2e1b1b617) was to use regexes
 * to find the field's random name, and in the replacement code, replace the dump name with the random name.
 * Figured it would happen like months or weeks before they renamed it, but he never listened;
 * And never made it not use such a brittle method of modifying such as replacing.
 * Later on when vector added the `jsContent` field to the bundle, it broke Vape for Miniblox entirely,
 * although that was probably way after Vape for Miniblox was discontinued or last updated.
 * Note that this isn't perfect, so it still can break.
 * I've added multiple more regexes, I probably should add those to Vape for Miniblox.
 * @module
*/

/**
 * Some regexes used to remap the bundle.
 * The 1st match is the name used.
 */
const REGEXES = {
	moveStrafe: /this\.([a-zA-Z]+)\s*=\s*\([a-zA-Z]+\.right/,
	moveForward: /this\.([a-zA-Z]+)\s*=\s*\([a-zA-Z]+\.(up|down)/,
	keyPressedPlayer: /function ([a-zA-Z]*)\(([a-zA-Z]*)\)\s*\{\n*\t*return keyPressed/m,
	// PathNavigateGround#isPositionClear
	iterator: /of\s+BlockPos\.([a-zA-Z]+)\(/,
	// EntityBoat#update
	normalizeAngle: /([a-zA-Z]+)\(([a-zA-Z]+)\s*-\s*this.yaw\)/,
	// PlayerMovement#checkHeadInBlock
	position: /BlockPos\.fromVector\(controls\.([a-zA-Z]+)\)/,
	// World#getLivingEntityCount
	entities: /this\.([a-zA-Z]*)\.values\(\)\)\s*[a-zA-Z]* instanceof EntityLiving/m,
	isInvisible: /[a-zA-Z]+\.([a-zA-Z]*)\(\)\)\s*&&\n*\t*\([a-zA-Z]*\s*=\s*new\s+[a-zA-Z]*\(/m,
	attackTargetEntityWithCurrentItem: /hitVec.z,\n\t*\}\),\n\t*\}\),\n\t*\),\n\t*player.([a-zA-Z]*)\(/m,
	lastReportedYaw: /this\.([a-zA-Z]*) *= *this\.yaw\),\n*\t*\(this\.last/m,
	windowClick: /([a-zA-Z]*)\(this\.inventorySlots\.windowId/m,
	damageReduceAmount: /ItemArmor && \([a-zA-Z]+ \+= [a-zA-Z]*\.item\.([a-zA-Z]*)/,
	playerController: /const ([a-zA-Z]*) = new PlayerController\(/,
	boxGeometry: /w = new Mesh\(\n\t*new ([a-zA-Z]*)\(1, 1, 1\),/m,
	// playerControllerMP
	syncItem: /([a-zA-Z]*)\(\),\n*\t*ClientSocket\.sendPacket/m,
	// GLTF manager
	gltfManager: /([a-zA-Z]*)("|'|`),\s*new GLTFManager/,
	AxisAlignedBoundingBox: /this\.boundingBox\s*=\s*new ([a-zA-Z]*)/m,
	loadModels: /loadTextures\(\),*\n*\t*this\.[a-zA-Z]*\.([a-zA-Z]*)\(\)/m,
	// Shader Manager
	addShaderToMaterialWorld: /ShaderManager\.([a-zA-Z]*)\(this\.materialWorld/,
	materialTransparentWorld: /this\.([a-zA-Z]*)\s*=\s*this\.materialTransparent\.clone\(/
};

// pasted from Llama 3.3 70B on DuckDuckGo
export default function remap(text: string) {
    let remappedText = text;
    const matches: { [name: string]: string } = {};
    for (const [name, regex] of Object.entries(REGEXES)) {
        const match = remappedText.match(regex);
        if (match !== null && match[1] !== undefined) {
            matches[name] = match[1];
            console.log(`Remap ${name} -> ${match[1]}`);
        } else {
            console.warn(`Unmapped: ${name}`);
        }
    }
    for (const [name, match] of Object.entries(matches)) {
        remappedText = remappedText.replaceAll(match, name);
        console.log(`Remapping ${match} -> ${name}`);
    }
    return remappedText;
}



if (import.meta.main) {
	await Deno.readTextFile("./bundle.js")
	.then(remap)
	.then(result => Deno.writeTextFile("./bundle-remapped.js", result));
}
