import {createPdfViewer} from '../../shared/pdf-viewer.mjs';
import {resolveViewerPdf,isViewerPdfLocked} from './viewer-link.mjs';

const pdf=resolveViewerPdf(location.search,location.href);
const error=document.querySelector('#viewer-error');
const reopen=document.querySelector('#viewer-reopen');
if(!pdf){error.hidden=false;}
else{
  const name=decodeURIComponent(pdf.pathname.split('/').at(-1));
  document.title=`${name} | AV Portal`;
  let manifest=null;
  if(pdf.pathname.startsWith(new URL('../../manuals/',location.href).pathname)){
    try{const response=await fetch('../../docs/manifest.json');if(response.ok)manifest=await response.json();}catch{/* Fail closed for unlisted uploads. */}
  }
  const locked=isViewerPdfLocked(pdf,location.href,manifest);
  const viewer=createPdfViewer();
  const show=()=>viewer.open({file:pdf.href,title:name,sourceUrl:pdf.href,locked,trigger:reopen});
  reopen.hidden=false;
  reopen.addEventListener('click',show);
  show();
}
