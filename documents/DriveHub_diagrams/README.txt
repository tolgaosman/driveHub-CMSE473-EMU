DriveHub SRS - diagram sources
source_mermaid/*.mmd  : sequence, class, LDM and PDM diagrams.
                        Edit in draw.io (Arrange > Insert > Advanced > Mermaid) or at mermaid.live.
source_graphviz/*.dot : DFDs, architecture, deployment, activity, use case, CDM, state,
                        package and communication diagrams. Render with: dot -Tpng file.dot -o file.png
                        (or paste into an online Graphviz editor).
source_graphviz/bpmn.py : draws the two BPMN swimlane diagrams (Python + matplotlib).
ui_mockups_html/      : HTML mock-ups of the UI screens (open in a browser).
png/                  : all images used in the Word document.
