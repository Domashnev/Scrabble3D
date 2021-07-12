import { WindowRefService } from './../services/window-ref.service';
import {ElementRef, Injectable, NgZone} from '@angular/core';
import {
  Engine,
  FreeCamera,
  Scene,
  Light,
  Mesh,
  Color3,
  Color4,
  Vector3,
  HemisphericLight,
  StandardMaterial,
  Texture,
  DynamicTexture,
  Space,
  PointLight,
  ArcRotateCamera, HighlightLayer,
} from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';

@Injectable({ providedIn: 'root' })
export class EngineService {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private camera: any;
  private scene: Scene;
  private light: Light;

  private sphere: Mesh;

  public constructor(
    private ngZone: NgZone,
    private windowRef: WindowRefService
  ) {}

  public createScene(canvas: ElementRef<HTMLCanvasElement>): void {
    // The first step is to get the reference of the canvas element from our HTML document
    this.canvas = canvas.nativeElement;

    // Then, load the Babylon 3D engine:
    this.engine = new Engine(this.canvas,  true);

    // create a basic BJS Scene object
    this.scene = new Scene(this.engine);
    this.scene.clearColor = new Color4(0, 0, 0, 0);

    /*
    // create a FreeCamera, and set its position to (x:5, y:10, z:-20 )
    this.camera = new FreeCamera('camera1', new Vector3(5, 10, -20), this.scene);
    // target the camera to scene origin
    this.camera.setTarget(Vector3.Zero());

    // attach the camera to the canvas
    this.camera.attachControl(this.canvas, false);
*/
    // create a basic light, aiming 0,1,0 - meaning, to the sky
    this.light = new HemisphericLight('light1', new Vector3(0, 1, 0), this.scene);
    // this.light = new PointLight('Omni', new Vector3(10, 10, 10), this.scene);

    // this.camera = new FreeCamera('camera1', new Vector3(5, 10, -20), this.scene);
    this.camera = new ArcRotateCamera('Camera', 2, 2, 20, new Vector3(0, 1, 0), this.scene);
    this.camera.setTarget(Vector3.Zero());
    this.camera.attachControl(canvas, false);

    const material1 = new StandardMaterial('mat1', this.scene);
    material1.diffuseColor = new Color3(1, 1, 0);
    const texture = new Texture('assets/Буква А.png', this.scene);
    material1.diffuseTexture = texture;

    const hl = new HighlightLayer('hl1', this.scene);
   // const letterTexture = new DynamicTexture('Letter', 1, this.scene, false);
    const letters = ['А', 'Ж', 'Ю', 'Л', 'Е', 'М', 'Т'];
    for (let i = 0; i < 7; i++) {
      const box = Mesh.CreateBox('Box', 1.0, this.scene);
      i % 2 === 0 ? box.showBoundingBox = true : hl.addMesh(box, Color3.Blue(), true);

     /* const letterTexture = new DynamicTexture('dynamic texture', box, this.scene, false);
      const fontSize = this.setFontSize(letterTexture, letters[i])
      letterTexture.drawText(letters[i], 0.2, 0.2, 'bold ' + fontSize + 'px Roboto', 'green', null, false, true);
      letterTexture.drawText(letters[i], 1.2, 0.2, 'bold ' + fontSize + 'px Roboto', 'red', null, true, true);
      letterTexture.drawText(letters[i], 2.2, 0.5, 'normal ' + fontSize + 'px Roboto', 'red', null, true, true);
      material1.diffuseTexture = letterTexture;
      material1.diffuseColor = new Color3(1, 1, 0);*/

      box.material = material1;
      box.position = new Vector3(i * 1.5 , 0, 0);
    }

    const grid = new GridMaterial('grid', this.scene);
    grid.gridRatio = 1;

    const field = Mesh.CreateBox('field', 10 , this.scene, false);
    field.position = new Vector3(-10, -2, 0);
    field.material = grid;
   /*
    // create a built-in "sphere" shape; its constructor takes 4 params: name, subdivisions, radius, scene
    this.sphere = Mesh.CreateSphere('sphere1', 16, 2, this.scene);

    // create the material with its texture for the sphere and assign it to the sphere
    const spherMaterial = new StandardMaterial('sun_surface', this.scene);
    spherMaterial.diffuseTexture = new Texture('assets/textures/sun.jpg', this.scene);
    this.sphere.material = spherMaterial;

    // move the sphere upward 1/2 of its height
    this.sphere.position.y = 1;

    // simple rotation along the y axis
    this.scene.registerAfterRender(() => {
      this.sphere.rotate (
        new Vector3(0, 1, 0),
        0.02,
        Space.LOCAL
      );
   });
*/
    // generates the world x-y-z axis for better understanding
    this.showWorldAxis(15);
  }

  public setFontSize(dynamicTexture: DynamicTexture, text: string): number {
    const ctx = dynamicTexture.getContext();
    const size = 12;
    ctx.font = 'bold ' + size + 'px Roboto';
    const textWidth = ctx.measureText(text).width;
    console.log(textWidth);
    return Math.floor(1 / (textWidth * 1.1));
  }

  public animate(): void {
    // We have to run this outside angular zones,
    // because it could trigger heavy changeDetection cycles.
    this.ngZone.runOutsideAngular(() => {
      const rendererLoopCallback = () => {
        this.scene.render();
      };

      if (this.windowRef.document.readyState !== 'loading') {
        this.engine.runRenderLoop(rendererLoopCallback);
      } else {
        this.windowRef.window.addEventListener('DOMContentLoaded', () => {
          this.engine.runRenderLoop(rendererLoopCallback);
        });
      }

      this.windowRef.window.addEventListener('resize', () => {
        this.engine.resize();
      });
    });
  }

  /**
   * creates the world axes
   *
   * Source: https://doc.babylonjs.com/snippets/world_axes
   *
   * @param size number
   */
  public showWorldAxis(size: number): void {

    const makeTextPlane = (text: string, color: string, textSize: number) => {
      const dynamicTexture = new DynamicTexture('DynamicTexture', 50, this.scene, true);
      dynamicTexture.hasAlpha = true;
      dynamicTexture.drawText(text, 5, 40, 'bold 36px Arial', color , 'transparent', true);
      const plane = Mesh.CreatePlane('TextPlane', textSize, this.scene, true);
      const material = new StandardMaterial('TextPlaneMaterial', this.scene);
      material.backFaceCulling = false;
      material.specularColor = new Color3(0, 0, 0);
      material.diffuseTexture = dynamicTexture;
      plane.material = material;

      return plane;
    };

    const axisX = Mesh.CreateLines(
      'axisX',
      [
        Vector3.Zero(),
        new Vector3(size, 0, 0), new Vector3(size * 0.95, 0.05 * size, 0),
        new Vector3(size, 0, 0), new Vector3(size * 0.95, -0.05 * size, 0)
      ],
      this.scene
    );

    axisX.color = new Color3(1, 0, 0);
    const xChar = makeTextPlane('X', 'red', size / 10);
    xChar.position = new Vector3(0.9 * size, -0.05 * size, 0);

    const axisY = Mesh.CreateLines(
      'axisY',
      [
        Vector3.Zero(), new Vector3(0, size, 0), new Vector3( -0.05 * size, size * 0.95, 0),
        new Vector3(0, size, 0), new Vector3( 0.05 * size, size * 0.95, 0)
      ],
      this.scene
    );

    axisY.color = new Color3(0, 1, 0);
    const yChar = makeTextPlane('Y', 'green', size / 10);
    yChar.position = new Vector3(0, 0.9 * size, -0.05 * size);

    const axisZ = Mesh.CreateLines(
      'axisZ',
      [
        Vector3.Zero(), new Vector3(0, 0, size), new Vector3( 0 , -0.05 * size, size * 0.95),
        new Vector3(0, 0, size), new Vector3( 0, 0.05 * size, size * 0.95)
      ],
      this.scene
    );

    axisZ.color = new Color3(0, 0, 1);
    const zChar = makeTextPlane('Z', 'blue', size / 10);
    zChar.position = new Vector3(0, 0.05 * size, 0.9 * size);
  }
}
