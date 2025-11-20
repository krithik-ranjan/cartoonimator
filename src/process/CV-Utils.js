const OBJECT_MARKER_SCALE = 3.6

const SCAN_OFFSET_X = 108
const SCAN_OFFSET_Y = 72
const SCAN_OFFSET_SCALE = 1.25   // 1080 / (1080 - 216) or 720 / (720 - 144)

const OBJECT_ID_RANGE = [100, 120]

export const findMarkers = (img, markers) => {
    let detectionParams = new cv.aruco_DetectorParameters()
    let refineParams = new cv.aruco_RefineParameters(10.0, 3.0, true)
    let dictionary = cv.getPredefinedDictionary(cv.DICT_ARUCO_ORIGINAL)
    let detector = new cv.aruco_ArucoDetector(dictionary, detectionParams, refineParams)

    // Clean out the marker map
    markers.clear()

    let corners = new cv.MatVector()
    let ids = new cv.Mat()

    detector.detectMarkers(img, corners, ids)

    if (corners.size() > 0) {
        // Markers found, add them to map and return 
        let i
        for (i = 0; i < corners.size(); i++) {
            if (ids.data32S[i] > 120) 
                continue

            // let cornerMap = new Map();
            // cornerMap.set('tl', { x: corners.get(i).data32F[0], y: corners.get(i).data32F[1] })
            // cornerMap.set('tr', { x: corners.get(i).data32F[2], y: corners.get(i).data32F[3] })
            // cornerMap.set('br', { x: corners.get(i).data32F[4], y: corners.get(i).data32F[5] })
            // cornerMap.set('bl', { x: corners.get(i).data32F[6], y: corners.get(i).data32F[7] })

            let cornerObj = {}
            cornerObj['tl'] = { x: corners.get(i).data32F[0], y: corners.get(i).data32F[1] }
            cornerObj['tr'] = { x: corners.get(i).data32F[2], y: corners.get(i).data32F[3] }
            cornerObj['br'] = { x: corners.get(i).data32F[4], y: corners.get(i).data32F[5] }
            cornerObj['bl'] = { x: corners.get(i).data32F[6], y: corners.get(i).data32F[7] }
            
            markers.set(ids.data32S[i], cornerObj)
        }
    }

    corners.delete()
    ids.delete()

    return markers
}

export const markBackground = (img, markers) => {
  console.log('Marking background')

  // Define the color of the outline for objects
  const color = new cv.Scalar(242, 185, 80, 75)

  let bgPolygon = new cv.Mat(4, 1, cv.CV_32SC2)
  bgPolygon.data32S.set([
    markers.get(10).tl.x, markers.get(10).tl.y,
    markers.get(11).tl.x, markers.get(11).tl.y,
    markers.get(12).tl.x, markers.get(12).tl.y,
    markers.get(13).tl.x, markers.get(13).tl.y
  ])

  let contours = new cv.MatVector()
  contours.push_back(bgPolygon)

  cv.drawContours(img, contours, -1, color, cv.FILLED)

  bgPolygon.delete()
  contours.delete()
}

export const markObjects = (img, markers) => {
  // Define the color of the outline for objects
  const color = new cv.Scalar(0, 255, 255, 125)

  let objectPolygon = new cv.Mat(4, 1, cv.CV_32SC2)
  let contours = new cv.MatVector()
  markers.forEach((markerCorners, markerId) => {
    if (markerId >= OBJECT_ID_RANGE[0] && markerId <= OBJECT_ID_RANGE[1]) {
      objectPolygon.data32S.set([
        markerCorners.tl.x, markerCorners.tl.y, // Top-left corner
        // Top-right corner
        markerCorners.tl.x + OBJECT_MARKER_SCALE * (markerCorners.tr.x - markerCorners.tl.x),
        markerCorners.tl.y + OBJECT_MARKER_SCALE * (markerCorners.tr.y - markerCorners.tl.y),
        // Bottom-right corner
        markerCorners.tl.x + OBJECT_MARKER_SCALE * (markerCorners.br.x - markerCorners.tl.x), 
        markerCorners.tl.y + OBJECT_MARKER_SCALE * (markerCorners.br.y - markerCorners.tl.y),
        // Bottom-left corner
        markerCorners.tl.x + OBJECT_MARKER_SCALE * (markerCorners.bl.x - markerCorners.tl.x),
        markerCorners.tl.y + OBJECT_MARKER_SCALE * (markerCorners.bl.y - markerCorners.tl.y)
      ])
      
      contours.push_back(objectPolygon)
    }
  })

  cv.drawContours(img, contours, -1, color, cv.FILLED)

  objectPolygon.delete()
  contours.delete()
}

export const flattenImg = (img, res, corners, width, height, offset=false) => {
  console.log(`Flattening image, size: ${img.cols}, ${img.rows}`)
  console.log('Corners: ', corners)

  let offX = 0
  let offY = 0
  if (offset) {
    offX = SCAN_OFFSET_X
    offY = SCAN_OFFSET_Y
  }

  let dst = new cv.Mat()
  let dsize = new cv.Size(width, height)
  let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners.tl.x,
    corners.tl.y,
    corners.tr.x,
    corners.tr.y,
    corners.br.x,
    corners.br.y,
    corners.bl.x,
    corners.bl.y,
  ])
  let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    offX,
    offY,
    width - offX,
    offY,
    width - offX,
    height - offY,
    offX,
    height - offY,
  ])

  let M = cv.getPerspectiveTransform(srcTri, dstTri)
  cv.warpPerspective(
    img,
    dst, 
    M,
    dsize, 
    cv.INTER_LINEAR,
    cv.BORDER_CONSTANT,
  )
  dst.copyTo(res)

  dst.delete()
  srcTri.delete()
  dstTri.delete()

  return M
}

function getPointTransform(point, M) {
    let x =
      (M.doubleAt(0, 0) * point.x +
        M.doubleAt(0, 1) * point.y +
        M.doubleAt(0, 2)) /
      (M.doubleAt(2, 0) * point.x +
        M.doubleAt(2, 1) * point.y +
        M.doubleAt(2, 2))
    let y =
      (M.doubleAt(1, 0) * point.x +
        M.doubleAt(1, 1) * point.y +
        M.doubleAt(1, 2)) /
      (M.doubleAt(2, 0) * point.x +
        M.doubleAt(2, 1) * point.y +
        M.doubleAt(2, 2))
    // console.log(`(${x}, ${y})`);
    return new cv.Point(parseInt(x, 10), parseInt(y, 10))
}

export const findObjectsCircle = (img, markers, M) => {
  let i, tl, tr, br, bl 
  console.log('Capturing objects with markers:')
  console.log(markers)

  let objects = {}

  markers.forEach((markerCorners, markerId) => {
    if (markerId >= OBJECT_ID_RANGE[0] && markerId <= OBJECT_ID_RANGE[1]) {
      // Based on calculation from https://www.quora.com/Given-two-diagonally-opposite-points-of-a-square-how-can-I-find-out-the-other-two-points-in-terms-of-the-coordinates-of-the-known-points

      tl = getPointTransform(markerCorners.tl, M)

      br = getPointTransform(markerCorners.br, M)
      br.x = tl.x + (br.x - tl.x) * OBJECT_MARKER_SCALE
      br.y = tl.y + (br.y - tl.y) * OBJECT_MARKER_SCALE

      tr = getPointTransform(markerCorners.tr, M)
      tr.x = (tl.x + br.x + br.y - tl.y) / 2
      tr.y = (tl.x - br.x + tl.y + br.y) / 2

      bl = getPointTransform(markerCorners.bl, M)
      bl.x = (tl.x + br.x + tl.y - br.y) / 2
      bl.y = (br.x - tl.x + tl.y + br.y) / 2

      // console.log(`[debug] Object (${markerId}) corners:`)
      // console.log(`\ttl: ${tl.x}, ${tl.y}`)
      // console.log(`\ttr: ${tr.x}, ${tr.y}`)
      // console.log(`\tbr: ${br.x}, ${br.y}`)
      // console.log(`\tbl: ${bl.x}, ${bl.y}`)

      // Setup mask to obtain object
      let mask = new cv.Mat(img.rows, img.cols, img.type())
      cv.rectangle(
        mask,
        new cv.Point(0, 0),
        new cv.Point(img.cols, img.rows),
        new cv.Scalar(0, 0, 0, 255),
        cv.FILLED
      )
      
      // Instead of polygon, use circle to capture object (better removing border pixels)
      let cardSize = Math.hypot(tr.x - tl.x, tr.y - tl.y) * 0.9
      let cardCenter = new cv.Point((tl.x + br.x) / 2, (tl.y + br.y) / 2)
      cv.circle(mask, cardCenter, cardSize / 2, new cv.Scalar(255, 255, 255, 255), cv.FILLED)

      // Create circle to cover marker
      let markerTl = {x: getPointTransform(markerCorners.tl, M).x, y: getPointTransform(markerCorners.tl, M).y}
      let markerBr = {x: getPointTransform(markerCorners.br, M).x, y: getPointTransform(markerCorners.br, M).y}
      cv.circle(
        mask, 
        new cv.Point((markerTl.x + markerBr.x) / 2, (markerTl.y + markerBr.y) / 2),
        Math.hypot(markerBr.x - markerTl.x, markerBr.y - markerTl.y) * 0.6,
        new cv.Scalar(0, 0, 0, 255),
        cv.FILLED
      )

      // Extract object
      let dst = new cv.Mat(img.rows, img.cols, img.type())
      cv.rectangle(
        dst, 
        new cv.Point(0, 0),
        new cv.Point(img.cols, img.rows),
        new cv.Scalar(255, 255, 255, 255),
        cv.FILLED
      )
      cv.bitwise_and(img, mask, dst)

      // Make background white
      cv.cvtColor(mask, mask, cv.COLOR_RGBA2GRAY);
      cv.bitwise_not(mask, mask);
      cv.cvtColor(mask, mask, cv.COLOR_GRAY2RGBA);
      cv.bitwise_or(dst, mask, dst);

      // Top-left corner and size of the object (least square fully containing the object card)
      let pos = {
        x: cardCenter.x - cardSize / 2,
        y: cardCenter.y - cardSize / 2
      }
      let size = cardSize

      // console.log('Object pos and size (with offset): ')
      // console.log(pos)
      // console.log(size)

      // Crop the object and remove background
      let roiObject = new cv.Mat()
      let rect = new cv.Rect(pos.x, pos.y, size, size)
      dst.roi(rect).copyTo(roiObject)
      // console.log('roi')

      // removeBackgroundBasic(roiObject)
      removeBackgroundAdvanced(roiObject)

      // Scale measurements back to full size (1080p, no margins)
      pos = {
        x: Math.floor((pos.x - SCAN_OFFSET_X) * SCAN_OFFSET_SCALE),
        y: Math.floor((pos.y - SCAN_OFFSET_Y) * SCAN_OFFSET_SCALE)
      }
      size = Math.floor(size * SCAN_OFFSET_SCALE)
      let center = { x: Math.floor(pos.x + size / 2), y: Math.floor(pos.y + size / 2) }
      let rot = Math.atan2(tr.y - tl.y, tr.x - tl.x) * (180 / Math.PI)

      // console.log(`Object [${markerId}]`)
      // console.log(`Center: `)
      // console.log(center)
      // console.log('Pos: ')
      // console.log(pos)
      // console.log('Size: ')
      // console.log(size)
      // console.log(`Rotation: ${rot} deg`)

      let objImageData = new ImageData(new Uint8ClampedArray(roiObject.data), roiObject.cols, roiObject.rows)
      // console.log('Object Image Data: ')
      // console.log(objImageData)
      // console.log(`Channels: ${roiObject.channels()}`)
      objects[`sp${markerId}`] = {
          img: objImageData,
          center: center,
          pos: pos,
          rot: rot,
          size: size
        }

      mask.delete()
      roiObject.delete()
      dst.delete()
    }
  })

  return objects
}

export const findObjects = (img, markers, M) => {
  let i, tl, tr, br, bl 
  console.log('Capturing objects with markers:')
  console.log(markers)

  let objects = {}

  markers.forEach((markerCorners, markerId) => {
    if (markerId >= OBJECT_ID_RANGE[0] && markerId <= OBJECT_ID_RANGE[1]) {
      // Based on calculation from https://www.quora.com/Given-two-diagonally-opposite-points-of-a-square-how-can-I-find-out-the-other-two-points-in-terms-of-the-coordinates-of-the-known-points

      tl = getPointTransform(markerCorners.tl, M)

      br = getPointTransform(markerCorners.br, M)
      br.x = tl.x + (br.x - tl.x) * OBJECT_MARKER_SCALE
      br.y = tl.y + (br.y - tl.y) * OBJECT_MARKER_SCALE

      tr = getPointTransform(markerCorners.tr, M)
      tr.x = (tl.x + br.x + br.y - tl.y) / 2
      tr.y = (tl.x - br.x + tl.y + br.y) / 2

      bl = getPointTransform(markerCorners.bl, M)
      bl.x = (tl.x + br.x + tl.y - br.y) / 2
      bl.y = (br.x - tl.x + tl.y + br.y) / 2

      console.log(`[debug] Object (${markerId}) corners:`)
      console.log(`\ttl: ${tl.x}, ${tl.y}`)
      console.log(`\ttr: ${tr.x}, ${tr.y}`)
      console.log(`\tbr: ${br.x}, ${br.y}`)
      console.log(`\tbl: ${bl.x}, ${bl.y}`)

      // Setup mask to obtain object
      let mask = new cv.Mat(img.rows, img.cols, img.type())
      cv.rectangle(
        mask,
        new cv.Point(0, 0),
        new cv.Point(img.cols, img.rows),
        new cv.Scalar(0, 0, 0, 255),
        cv.FILLED
      )

      // Create polygons for the object card and for the object marker
      let objPolygon = new cv.Mat(4, 1, cv.CV_32SC2)
      objPolygon.data32S.set([
        tl.x, tl.y,
        tr.x, tr.y,
        br.x, br.y,
        bl.x, bl.y
      ])
      let contours = new cv.MatVector()
      contours.push_back(objPolygon)
      cv.drawContours(mask, contours, 0, new cv.Scalar(255, 255, 255, 255), cv.FILLED)
      
      // Instead of polygon, use circle to capture object (better removing border pixels)
      // let cardSize = Math.hypot(tr.x - tl.x, tr.y - tl.y)
      // let cardCenter = new cv.Point((tl.x + br.x) / 2, (tl.y + br.y) / 2)
      // cv.circle(mask, cardCenter, cardSize / 2, new cv.Scalar(255, 255, 255, 255), cv.FILLED)

      // Create circle to cover marker
      let markerTl = {x: getPointTransform(markerCorners.tl, M).x, y: getPointTransform(markerCorners.tl, M).y}
      let markerBr = {x: getPointTransform(markerCorners.br, M).x, y: getPointTransform(markerCorners.br, M).y}
      cv.circle(
        mask, 
        new cv.Point((markerTl.x + markerBr.x) / 2, (markerTl.y + markerBr.y) / 2),
        Math.hypot(markerBr.x - markerTl.x, markerBr.y - markerTl.y) * 0.6,
        new cv.Scalar(0, 0, 0, 255),
        cv.FILLED
      )

      // Extract object
      let dst = new cv.Mat(img.rows, img.cols, img.type())
      cv.rectangle(
        dst, 
        new cv.Point(0, 0),
        new cv.Point(img.cols, img.rows),
        new cv.Scalar(255, 255, 255, 255),
        cv.FILLED
      )
      cv.bitwise_and(img, mask, dst)

      // Make background white
      cv.cvtColor(mask, mask, cv.COLOR_RGBA2GRAY);
      cv.bitwise_not(mask, mask);
      cv.cvtColor(mask, mask, cv.COLOR_GRAY2RGBA);
      cv.bitwise_or(dst, mask, dst);

      // Top-left corner and size of the object (least square fully containing the object card)
      let pos = {
        x: Math.floor(Math.min(tl.x, tr.x, br.x, bl.x)),
        y: Math.floor(Math.min(tl.y, tr.y, br.y, bl.y))
      }
      let size = Math.floor(Math.max((Math.max(tl.x, tr.x, br.x, bl.x) - pos.x), (Math.max(tl.y, tr.y, br.y, bl.y) - pos.y)))

      console.log('Object pos and size (with offset): ')
      console.log(pos)
      console.log(size)

      // Crop the object and remove background
      let roiObject = new cv.Mat()
      let rect = new cv.Rect(pos.x, pos.y, size, size)
      dst.roi(rect).copyTo(roiObject)
      // console.log('roi')

      // removeBackgroundBasic(roiObject)
      removeBackgroundAdvanced(roiObject)

      // Scale measurements back to full size (1080p, no margins)
      pos = {
        x: Math.floor((pos.x - SCAN_OFFSET_X) * SCAN_OFFSET_SCALE),
        y: Math.floor((pos.y - SCAN_OFFSET_Y) * SCAN_OFFSET_SCALE)
      }
      size = Math.floor(size * SCAN_OFFSET_SCALE)
      let center = { x: Math.floor(pos.x + size / 2), y: Math.floor(pos.y + size / 2) }
      let rot = Math.atan2(tr.y - tl.y, tr.x - tl.x) * (180 / Math.PI)

      // let center = new cv.Point((tl.x + br.x) / 2, (tl.y + br.y) / 2)
      // let center = { 
      //   x: Math.floor(SCAN_OFFSET_SCALE * (tl.x + br.x) / 2) - SCAN_OFFSET_X, 
      //   y: Math.floor(SCAN_OFFSET_SCALE * (tl.y + br.y) / 2) - SCAN_OFFSET_Y 
      // }
      // let size = Math.floor(Math.hypot(tl.x - tr.x, tl.y - tr.y) * SCAN_OFFSET_SCALE)
      // let pos = { x: Math.floor(center.x - size / 2), y: Math.floor(center.y - size / 2) }
      // let rot = Math.atan2(tr.y - tl.y, tr.x - tl.x) * (180 / Math.PI)

      // Extract object drawing as ROI
      

      // Update coordinates and size for scaling back to 1080p
      // center.x = SCAN_OFFSET_SCALE * center.x - SCAN_OFFSET_X
      // center.y = SCAN_OFFSET_SCALE * center.y - SCAN_OFFSET_Y
      // size = Math.floor(size * SCAN_OFFSET_SCALE)
      // pos.x = Math.floor(center.x - size / 2)
      // pos.y = Math.floor(center.y - size / 2)

      console.log(`Object [${markerId}]`)
      console.log(`Center: `)
      console.log(center)
      console.log('Pos: ')
      console.log(pos)
      console.log('Size: ')
      console.log(size)

      // objects.set(i, {
      //   img: roiObject,
      //   center: center,
      //   pos: pos,
      //   rot: rot,
      //   size: size
      // })

      // cv.rectangle(
      //   roiObject, 
      //   new cv.Point(0, 0),
      //   new cv.Point(roiObject.cols, roiObject.rows),
      //   new cv.Scalar(0, 255, 0, 255),
      //   cv.FILLED
      // )

      let objImageData = new ImageData(new Uint8ClampedArray(roiObject.data), roiObject.cols, roiObject.rows)
      console.log('Object Image Data: ')
      console.log(objImageData)
      console.log(`Channels: ${roiObject.channels()}`)
      objects[`sp${markerId}`] = {
          img: objImageData,
          center: center,
          pos: pos,
          rot: rot,
          size: size
        }


      // removeBackgroundBasic(roiObject)
      // removeBackgroundBasic(dst)

      // cv.rectangle(
      //   dst,
      //   new cv.Point(0, 0),
      //   new cv.Point(dst.cols, dst.rows),
      //   new cv.Scalar(0, 0, 0, 255),
      //   cv.FILLED
      // )
      // renderObjectsOnBg(img, roiObject, pos)
      // dst.copyTo(img)

      objPolygon.delete()
      contours.delete()
      mask.delete()
      roiObject.delete()
      dst.delete()
    }
  })

  return objects
}

const removeBackgroundBasic = (img) => {
  let imgGrey = new cv.Mat(img.rows, img.cols, img.type())
  cv.cvtColor(img, imgGrey, cv.COLOR_RGBA2GRAY)

  let meanColor = 120 // estimateBgColor(imgGrey, Math.floor(img.rows / 10))

  let fg = new cv.Mat()
  cv.threshold(imgGrey, fg, meanColor, 255, cv.THRESH_BINARY_INV)
  // cv.adaptiveThreshold(
  //   imgGrey,
  //   fg,  
  //   255, 
  //   cv.ADAPTIVE_THRESH_GAUSSIAN_C,
  //   cv.THRESH_BINARY_INV,
  //   21,
  //   10
  // )

  cv.cvtColor(fg, fg, cv.COLOR_GRAY2RGBA)
  cv.bitwise_and(img, fg, img)

  // Change transparency channel
  let imgPlanes = new cv.MatVector()
  cv.split(img, imgPlanes)
  cv.cvtColor(fg, fg, cv.COLOR_RGBA2GRAY)
  let fgPlanes = new cv.MatVector()
  cv.split(fg, fgPlanes)

  imgPlanes.set(3, fgPlanes.get(0))
  cv.merge(imgPlanes, img)

  imgGrey.delete()
  fg.delete()
  imgPlanes.delete()
  fgPlanes.delete()
}

const removeBackgroundAdvanced = (img) => {
  let imgGrey = new cv.Mat(img.rows, img.cols, img.type())
  cv.cvtColor(img, imgGrey, cv.COLOR_RGBA2GRAY)

  // let meanColor = estimateBgColor(imgGrey, Math.floor(img.rows / 10))

  let fg = new cv.Mat()
  cv.threshold(imgGrey, fg, 130, 255, cv.THRESH_BINARY_INV)
  // cv.adaptiveThreshold(
  //   imgGrey,
  //   fg,  
  //   255, 
  //   cv.ADAPTIVE_THRESH_GAUSSIAN_C,
  //   cv.THRESH_BINARY_INV,
  //   31,
  //   5
  // )

  // Morphological operations to clean up the mask
  let kernel = cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(3, 3))
  cv.morphologyEx(fg, fg, cv.MORPH_CLOSE, kernel)
  cv.morphologyEx(fg, fg, cv.MORPH_DILATE, kernel)
  cv.morphologyEx(fg, fg, cv.MORPH_OPEN, kernel)
  kernel.delete()

  cv.cvtColor(fg, fg, cv.COLOR_GRAY2RGBA)
  cv.bitwise_and(img, fg, img)

  // Change transparency channel
  let imgPlanes = new cv.MatVector()
  cv.split(img, imgPlanes)
  cv.cvtColor(fg, fg, cv.COLOR_RGBA2GRAY)
  let fgPlanes = new cv.MatVector()
  cv.split(fg, fgPlanes)

  imgPlanes.set(3, fgPlanes.get(0))
  cv.merge(imgPlanes, img)

  imgGrey.delete()
  fg.delete()
  imgPlanes.delete()
  fgPlanes.delete()
}

const estimateBgColor = (img, border=10) => {
  let height = img.rows
  let width = img.cols

  let lowerBound = new cv.Mat(height, width, cv.CV_8UC1, new cv.Scalar(160))
  let upperBound = new cv.Mat(height, width, cv.CV_8UC1, new cv.Scalar(254))
  let mask = new cv.Mat()
  cv.inRange(img, lowerBound, upperBound, mask)

  console.log('Check check ', border, width, height)

  // Mask for border
  let borderMask = new cv.Mat(height, width, cv.CV_8UC1, new cv.Scalar(255))
  let center = { x: Math.floor(width / 2), y: Math.floor(height / 2) }
  cv.rectangle(
    borderMask,
    new cv.Point(border, border),
    new cv.Point(width - border, height - border),
    new cv.Scalar(0),
    cv.FILLED
  )

  console.log('Check check 2')
  let finalMask = new cv.Mat()
  cv.bitwise_and(mask, borderMask, finalMask)

  // Calculate average color
  let meanColor = Math.round(cv.mean(img, mask)[0])
  console.log('Estimated bg color: ')
  console.log(meanColor)

  // Fallback: if no border pixels found
  if (cv.countNonZero(finalMask) < 100) {
    mean = cv.mean(img, mask);
    meanColor = Math.round(mean[0]);
  }
  
  // Final fallback: if still no pixels, return default
  if (cv.countNonZero(mask) === 0) {
    meanColor = 240;
  }

  // Cleanup
  lowerBound.delete()
  upperBound.delete()
  mask.delete()
  borderMask.delete()
  finalMask.delete()

  return meanColor
}

const renderFrameHelper = (bg, obj, pos) => {
  // The pos is of the center of the object, derive the top left corner for rendering
    // let x = pos.x - Math.floor(obj.cols / 2)
    // let y = pos.y - Math.floor(obj.rows / 2)

    for (let i = 0; i < obj.rows; i++) {
      for (let j = 0; j < obj.cols; j++) {
        if (obj.ucharPtr(i, j)[3] === 255) {
          // Check if the pixel is within bounds before rendering
          if ((i + y) > 0 && (i + y) < bg.rows && (j + x) > 0 && (j + x) < bg.cols) {
            bg.ucharPtr(i + y, j + x)[0] = obj.ucharPtr(i, j)[0]
            bg.ucharPtr(i + y, j + x)[1] = obj.ucharPtr(i, j)[1]
            bg.ucharPtr(i + y, j + x)[2] = obj.ucharPtr(i, j)[2]
          }
        }
      }
    }
}