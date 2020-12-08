import { appState, nodeWsRootAddress } from '../globalConfig'

function getResizedUrlOfImg(imgUrl, { width, height = 0, resizingType = 'fill', gravity = 'ce' }) {
    // https://docs.imgproxy.net/#/generating_the_url_basic
    // resizingType:
    //     fit
    //     fill
    //     auto
    //
    // gravity:
    //     no: north (top edge);
    //     so: south (bottom edge);
    //     ea: east (right edge);
    //     we: west (left edge);
    //     noea: north-east (top-right corner);
    //     nowe: north-west (top-left corner);
    //     soea: south-east (bottom-right corner);
    //     sowe: south-west (bottom-left corner);
    //     ce: center;
    //     sm: smart
    if (appState.clientConfig.imgproxyBaseUrl) {
        return `${appState.clientConfig.imgproxyBaseUrl}/unsafe/${resizingType}/${width}/${height}/${gravity}/0/plain/${imgUrl}`
    } else {
        return imgUrl
    }
}

export { getResizedUrlOfImg }
