# Canvas Flow

Build Version 1 of my web application: a professional infinite whiteboard called "CanvasFlow".

IMPORTANT:
This is Version 1 only. Do not build authentication, database, realtime collaboration, AI features, billing, or complex team management yet.

The priority is a smooth, functional infinite canvas.

==================================================
TECH STACK

Use:

React

TypeScript

Tailwind CSS

A production-quality canvas library.

Prefer tldraw if it provides the required functionality cleanly. Otherwise use Konva.js.

Do NOT create a fake canvas using ordinary HTML divs.

==================================================
APPLICATION LAYOUT

Create a full-screen whiteboard application.

TOP BAR:

CanvasFlow logo

Board name: "Untitled Board"

Star button

Undo

Redo

Board status: "Saved locally"

Share button placeholder

Present button

Settings button

LEFT TOOLBAR:

Select

Hand

Sticky Note

Text

Pen

Highlighter

Eraser

Line

Arrow

Rectangle

Circle

Diamond

Image

Comment placeholder

Frame

BOTTOM-RIGHT CONTROLS:

Zoom out

Current zoom %

Zoom in

Fit to screen

Fullscreen

Keep the canvas as the dominant part of the screen.

==================================================
INFINITE CANVAS

Implement:

Infinite horizontal canvas

Infinite vertical canvas

Mouse-wheel zoom

Drag-to-pan

Space + drag to pan

Zoom from 10% to 400%

Smooth zoom

Fit-to-screen

Grid/dot-grid option

Clean white canvas

Objects must remain correctly positioned while zooming and panning.

==================================================
SELECT TOOL

Users can:

Select objects

Drag objects

Resize objects

Rotate objects

Multi-select

Duplicate

Delete

Copy

Paste

Group

Ungroup

Lock

Unlock

Bring forward

Send backward

When an object is selected, show a small contextual toolbar.

==================================================
STICKY NOTES

Clicking Sticky Note should allow the user to place a sticky note on the canvas.

Colors:

Yellow

Pink

Blue

Green

Purple

Orange

Features:

Editable text

Resize

Move

Rotate

Duplicate

Delete

Change color

Default:

220px × 180px

Rounded corners

Minimal shadow

Comfortable typography

Double-click should allow text editing.

==================================================
TEXT

Allow users to click anywhere and create text.

Support:

Font size

Bold

Italic

Underline

Alignment

Text color

Resize

==================================================
DRAWING

Implement:

Pen

Highlighter

Eraser

Controls:

Stroke width

Stroke color

Drawing must work with mouse and touch.

Make freehand strokes smooth.

==================================================
SHAPES

Implement:

Rectangle

Rounded rectangle

Circle

Diamond

Triangle

Properties:

Fill

Border

Border width

Opacity

Rotation

Resize

==================================================
LINES AND ARROWS

Implement:

Straight line

Arrow

Allow users to:

Change line width

Change line color

Move endpoints

Delete

==================================================
IMAGE

Allow:

Upload PNG

Upload JPG

Upload WEBP

Drag/drop image

Images should be movable, scalable and rotatable.

For Version 1, images may be stored locally in browser memory/localStorage if required.

==================================================
UNDO / REDO

Implement reliable:

Undo

Redo

Track:

Object creation

Deletion

Movement

Resize

Rotation

Text editing

Drawing

Color changes

Keyboard:
Ctrl/Cmd + Z
Ctrl/Cmd + Shift + Z

==================================================
LOCAL PERSISTENCE

For Version 1 only, automatically save the current board to browser localStorage or IndexedDB.

On browser refresh:

Restore the board

Restore objects

Restore positions

Restore zoom

Restore canvas state

Display:
"Saved locally"

==================================================
KEYBOARD SHORTCUTS

V = Select
H = Hand
N = Sticky Note
T = Text
P = Pen
E = Eraser
R = Rectangle
O = Circle
L = Line
A = Arrow
Delete = Delete
Ctrl/Cmd + Z = Undo
Ctrl/Cmd + Shift + Z = Redo
Space + drag = Pan

==================================================
DESIGN

Create a premium SaaS interface.

Style:

Minimal

Clean

Professional

White/light neutral UI

Subtle borders

Small shadows

Rounded controls

Compact toolbar

Excellent spacing

Do not copy Miro's exact branding, colors, icons, or proprietary visual assets.

The interface should be inspired by the usability of modern collaborative whiteboards.

==================================================
RESPONSIVENESS

Desktop is the primary target.

Also support:

Tablet

Touchscreen

For mobile, simplify the toolbar instead of trying to display every tool.

==================================================
QUALITY REQUIREMENT

Do not stop at a static UI mockup.

Every major tool must actually work.

Test:

Create sticky note

Move sticky note

Resize sticky note

Add text

Draw

Add shape

Add arrow

Upload image

Zoom

Pan

Undo

Redo

Refresh browser

Confirm board is restored

Fix any interaction bugs before finishing Version 1.

Do not add unnecessary features outside Version 1.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f8227b63-d991-4096-a8f8-be7a281cb543).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
