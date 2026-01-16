import type { DocumentModel, Template } from "../types";
import CahiersMint from "./CahiersMint";
import SidoOrange from "./SidoOrange";
import SidoVrilles from "./SidoVrilles";

export default function Renderer(
  props: Readonly<{
    doc: DocumentModel;
    template: Template;
    selectedKey?: string | null;
    onSelectKey?: (key: string) => void;
  }>
) {
  switch (props.template.id) {
    case "sido-orange":
      return (
        <SidoOrange
          doc={props.doc}
          template={props.template}
          selectedKey={props.selectedKey}
          onSelectKey={props.onSelectKey}
        />
      );
    case "cahiers-mint":
      return (
        <CahiersMint
          doc={props.doc}
          template={props.template}
          selectedKey={props.selectedKey}
          onSelectKey={props.onSelectKey}
        />
      );
    case "sido-vrilles":
      return (
        <SidoVrilles
          doc={props.doc}
          template={props.template}
          selectedKey={props.selectedKey}
          onSelectKey={props.onSelectKey}
        />
      );
    default:
      return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
          Template inconnu: <span className="font-mono">{props.template.id}</span>
        </div>
      );
  }
}

