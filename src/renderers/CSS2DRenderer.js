import {
    Matrix4,
    Object3D,
    Vector3
} from 'three';

class CSS2DObject extends Object3D {

    constructor(element = document.createElement('div')) {

        super();

        this.isCSS2DObject = true;

        this.element = element;

        this.element.style.position = 'absolute';
        this.element.style.userSelect = 'none';

        this.element.setAttribute('draggable', false);

        this.addEventListener('removed', function () {

            this.traverse(function (object) {

                if (object.element instanceof Element && object.element.parentNode !== null) {

                    object.element.parentNode.removeChild(object.element);

                }

            });

        });

    }

    copy(source, recursive) {

        super.copy(source, recursive);

        this.element = source.element.cloneNode(true);

        return this;

    }

}

//

const _vector = new Vector3();
const _viewMatrix = new Matrix4();
const _viewProjectionMatrix = new Matrix4();
const _a = new Vector3();
const _b = new Vector3();

class CSS2DRenderer {

    constructor(parameters = {}) {

        //console.log("in CSS2DRenderer, parameters.element", parameters.element)
        const _this = this;

        let _width, _height;
        let _widthHalf, _heightHalf;

        const cache = {
            objects: new WeakMap()
        };

        const domElement = parameters.element !== undefined ? parameters.element : document.createElement('div');

        //console.log("domElement", domElement, parameters.element)
        domElement.style.overflow = 'hidden';

        this.domElement = domElement;

        this.getSize = function () {

            return {
                width: _width,
                height: _height
            };

        };

        this.render = function (scene, camera) {

            if (scene.autoUpdate === true) scene.updateMatrixWorld();
            if (camera.parent === null) camera.updateMatrixWorld();

            _viewMatrix.copy(camera.matrixWorldInverse);
            _viewProjectionMatrix.multiplyMatrices(camera.projectionMatrix, _viewMatrix);

            renderObject(scene, scene, camera);
            zOrder(scene);

        };

        this.setSize = function (width, height) {

            _width = width;
            _height = height;

            _widthHalf = _width / 2;
            _heightHalf = _height / 2;

            domElement.style.width = width + 'px';
            domElement.style.height = height + 'px';

        };

        function renderObject(object, scene, camera) {
//console.log("in renderObject",object.isCSS2DObject)
            if (object.isCSS2DObject) {
//console.log("renderObject",object)

                _vector.setFromMatrixPosition(object.matrixWorld);
                _vector.applyMatrix4(_viewProjectionMatrix);
//console.log("vector", object.visible,_vector.z,object.layers.test( camera.layers ))

                const visible = (object.visible === true) && (_vector.z >= -1 && _vector.z <= 1) && (object.layers.test(camera.layers) === true);
                object.element.style.display = (visible === true) ? '' : 'none';
//console.log("renderObject",visible, object.element,_vector.x,_vector.y,_vector.z, _widthHalf, _heightHalf)
                if (visible === true) {

                    object.onBeforeRender(_this, scene, camera);

                    const element = object.element;
//console.log("element",element,element.parentNode, domElement)
                    element.style.transform = 'translate(-50%,-50%) translate(' + (_vector.x * _widthHalf + _widthHalf) + 'px,' + (-_vector.y * _heightHalf + _heightHalf) + 'px)';

                    if (element.parentNode !== domElement) {
//console.log("parentNode",element.parentNode, " | ",domElement)
                        domElement.appendChild(element);

                    }

                    object.onAfterRender(_this, scene, camera);

                }

                const objectData = {
                    distanceToCameraSquared: getDistanceToSquared(camera, object)
                };

                cache.objects.set(object, objectData);

            }

            for (let i = 0, l = object.children.length; i < l; i++) {

                renderObject(object.children[i], scene, camera);

            }

        }

        function getDistanceToSquared(object1, object2) {

            _a.setFromMatrixPosition(object1.matrixWorld);
            _b.setFromMatrixPosition(object2.matrixWorld);

            return _a.distanceToSquared(_b);

        }

        function filterAndFlatten(scene) {

            const result = [];

            scene.traverse(function (object) {

                if (object.isCSS2DObject) result.push(object);

            });

            return result;

        }

        function zOrder(scene) {

            const sorted = filterAndFlatten(scene).sort(function (a, b) {

                if (a.renderOrder !== b.renderOrder) {

                    return b.renderOrder - a.renderOrder;

                }

                const distanceA = cache.objects.get(a).distanceToCameraSquared;
                const distanceB = cache.objects.get(b).distanceToCameraSquared;

                return distanceA - distanceB;

            });

            const zMax = sorted.length;

            for (let i = 0, l = sorted.length; i < l; i++) {

                sorted[i].element.style.zIndex = zMax - i;

            }

        }

    }

}

export {CSS2DObject, CSS2DRenderer};